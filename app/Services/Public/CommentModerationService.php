<?php

namespace App\Services\Public;

use App\Models\AiProvider;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use Throwable;

/**
 * Moderación de comentarios en 2 capas (plan en
 * docs/backend/11-comments-and-reactions.md):
 *
 * Capa 1 (shouldHoldForReview, gratis): filtro por reglas que corre en
 * cada comentario antes de guardarlo. Si algo matchea, el comentario se
 * guarda igual pero queda `pending` (oculto al público).
 *
 * Capa 2 (reviewWithAi, opcional): solo para los que ya cayeron en
 * `pending` por la Capa 1. Le pasa el texto al proveedor de IA que el
 * admin activó para moderación (`is_active_for_moderation` en
 * /admin/ai-providers, igual que activa uno para imágenes o audio). Si
 * no hay ninguno activado, no hace nada — el comentario se queda
 * `pending` esperando revisión manual, como si la Capa 2 no existiera.
 */
class CommentModerationService
{
    public function shouldHoldForReview(User $user, string $body): bool
    {
        return $this->hasBannedWords($body)
            || $this->hasTooManyLinks($body)
            || $this->isRepeatedSpam($user, $body);
    }

    /**
     * Se llama desde un job en cola (ModerateCommentWithAiJob), nunca
     * dentro del request que crea el comentario — no hay que hacer
     * esperar al usuario a que responda la IA.
     */
    public function reviewWithAi(Comment $comment): void
    {
        // Si ya no está pending (un admin ya lo aprobó/borró a mano antes
        // de que el job corriera), no hay nada que hacer.
        if ($comment->status !== 'pending') {
            return;
        }

        $provider = AiProvider::where('is_active_for_moderation', true)
            ->whereNotNull('api_key')
            ->first();

        if (! $provider) {
            return;
        }

        try {
            $response = Prism::text()
                ->using($provider->provider, $provider->default_model, [
                    'api_key' => $provider->api_key,
                ])
                ->withPrompt($this->buildPrompt($comment->body))
                ->asText();

            [$verdict, $reason] = $this->parseVerdict($response->text);

            if ($verdict === 'OK') {
                $comment->update(['status' => 'visible', 'moderation_reason' => null]);
            } else {
                // Sigue pending — la IA solo confirma y explica el motivo,
                // no cambia que un admin todavía pueda aprobarlo a mano si
                // no está de acuerdo.
                $comment->update([
                    'moderation_reason' => $reason ?: 'Vulnera las normas de la comunidad',
                ]);
            }
        } catch (Throwable) {
            // Si la IA falla (rate limit, key mala, etc.), el comentario
            // se queda pending para revisión manual — no se pierde nada.
        }
    }

    private function buildPrompt(string $body): string
    {
        return <<<PROMPT
            Sos un moderador de comentarios de un sitio de noticias de anime/manga/gaming en español. Evaluá si este comentario de un usuario vulnera las normas básicas de la comunidad (insultos graves, discurso de odio, acoso, spam, contenido sexual explícito). Sé permisivo con el sarcasmo, el enojo normal de un fan, o el lenguaje informal — eso NO vulnera las normas.

            Comentario: "{$body}"

            Devolvé EXACTAMENTE una línea, sin texto adicional:
            OK
            o
            BLOQUEAR: (motivo de máximo 6 palabras en español, ej. "insulto grave hacia otro usuario")
            PROMPT;
    }

    /**
     * @return array{0: 'OK'|'BLOQUEAR', 1: ?string}
     */
    private function parseVerdict(string $text): array
    {
        $text = trim($text);

        if (preg_match('/^BLOQUEAR\s*:\s*(.+)/i', $text, $match)) {
            return ['BLOQUEAR', trim($match[1])];
        }

        if (Str::startsWith(Str::upper($text), 'OK')) {
            return ['OK', null];
        }

        // Respuesta que no matchea ningún formato esperado: por las dudas,
        // no se aprueba solo — queda pending para que lo vea un humano.
        return ['BLOQUEAR', 'Vulnera las normas de la comunidad'];
    }

    private function hasBannedWords(string $body): bool
    {
        $normalized = $this->normalize($body);

        foreach (config('comment_moderation.banned_words', []) as $word) {
            if (str_contains($normalized, $this->normalize($word))) {
                return true;
            }
        }

        return false;
    }

    private function hasTooManyLinks(string $body): bool
    {
        preg_match_all('#https?://[^\s<>"\']+#i', $body, $matches);
        $urls = $matches[0] ?? [];

        if (count($urls) > config('comment_moderation.max_links', 1)) {
            return true;
        }

        $ownHost = parse_url(config('app.url'), PHP_URL_HOST);

        foreach ($urls as $url) {
            $host = parse_url($url, PHP_URL_HOST);

            if ($host && $ownHost && ! Str::endsWith(strtolower($host), strtolower($ownHost))) {
                return true;
            }
        }

        return false;
    }

    private function isRepeatedSpam(User $user, string $body): bool
    {
        $threshold = config('comment_moderation.max_repeated_comments_per_hour', 3);

        $recentSameText = Comment::where('user_id', $user->id)
            ->where('body', $body)
            ->where('created_at', '>=', now()->subHour())
            ->count();

        return $recentSameText >= $threshold;
    }

    /**
     * Minúsculas y sin acentos, para que "PELOTUDO" o "pelótudo" también
     * matcheen contra la lista de `config('comment_moderation.banned_words')`.
     */
    private function normalize(string $value): string
    {
        $value = Str::lower($value);
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return $value;
    }
}
