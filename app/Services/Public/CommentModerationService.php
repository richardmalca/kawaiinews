<?php

namespace App\Services\Public;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Filtro automático de comentarios (Capa 1 del plan en
 * docs/backend/11-comments-and-reactions.md). Corre en cada comentario
 * antes de guardarlo, sin costo de IA. Si algo matchea, el comentario se
 * guarda igual pero queda `pending` (oculto al público) en vez de
 * `visible`, para que un admin lo revise — nunca se rechaza solo, porque
 * estas reglas tienen falsos positivos.
 */
class CommentModerationService
{
    public function shouldHoldForReview(User $user, string $body): bool
    {
        return $this->hasBannedWords($body)
            || $this->hasTooManyLinks($body)
            || $this->isRepeatedSpam($user, $body);
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
