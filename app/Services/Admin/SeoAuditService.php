<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\SiteSetting;
use App\Support\AiUsageLogger;
use DOMDocument;
use DOMXPath;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use Throwable;

/**
 * Audita el <head> que el sitio REALMENTE sirve (no lo que dice la
 * configuración): le pega una request de verdad al home y parsea el HTML
 * devuelto, así detecta si algo se rompió entre la configuración y lo que
 * termina en pantalla (caché vieja, un error silencioso, etc.).
 */
class SeoAuditService
{
    /**
     * @return array{tags: array<string, mixed>, checks: array<int, array{key: string, label: string, status: string, detail: string}>, ai_review: string|null, error: string|null}
     */
    public function audit(SiteSetting $settings): array
    {
        try {
            $response = Http::timeout(15)->get(url('/'));
        } catch (Throwable $exception) {
            return [
                'tags' => [],
                'checks' => [],
                'ai_review' => null,
                'error' => 'No se pudo cargar el sitio para analizarlo: '.$exception->getMessage(),
            ];
        }

        if (! $response->successful()) {
            return [
                'tags' => [],
                'checks' => [],
                'ai_review' => null,
                'error' => "El sitio respondió con un error ({$response->status()}) al intentar cargarlo.",
            ];
        }

        $tags = $this->extractTags($response->body());
        $checks = $this->runChecks($settings, $tags);
        $aiReview = $this->aiReview($tags, $checks);

        return [
            'tags' => $tags,
            'checks' => $checks,
            'ai_review' => $aiReview,
            'error' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function extractTags(string $html): array
    {
        $dom = new DOMDocument;
        // @ para silenciar los warnings de HTML5 malformado que DOMDocument
        // no entiende (no nos interesa que sea válido, solo leer lo que
        // hay). El prefijo con encoding="UTF-8" es el truco conocido para
        // que DOMDocument no confunda el UTF-8 con Latin-1 y mezcle los
        // acentos — sin esto "descripción" termina como "descripciÃ³n".
        @$dom->loadHTML('<?xml encoding="UTF-8">'.$html);
        $xpath = new DOMXPath($dom);

        $meta = fn (string $attr, string $value) => $xpath
            ->query("//meta[@{$attr}='{$value}']/@content")
            ->item(0)?->nodeValue;

        $titleNode = $xpath->query('//title')->item(0);

        return [
            'title' => $titleNode?->textContent,
            'description' => $meta('name', 'description'),
            'keywords' => $meta('name', 'keywords'),
            'canonical' => $xpath->query("//link[@rel='canonical']/@href")->item(0)?->nodeValue,
            'favicon' => $xpath->query("//link[@rel='icon']/@href")->item(0)?->nodeValue,
            'og_title' => $meta('property', 'og:title'),
            'og_description' => $meta('property', 'og:description'),
            'og_image' => $meta('property', 'og:image'),
            'twitter_card' => $meta('name', 'twitter:card'),
            'json_ld_count' => $xpath->query("//script[@type='application/ld+json']")->length,
        ];
    }

    /**
     * @param  array<string, mixed>  $tags
     * @return array<int, array{key: string, label: string, status: string, detail: string}>
     */
    private function runChecks(SiteSetting $settings, array $tags): array
    {
        $titleLength = mb_strlen((string) $tags['title']);
        $descriptionLength = mb_strlen((string) $tags['description']);

        return [
            $this->check(
                'title_length',
                'Largo del título',
                $titleLength > 0 && $titleLength <= 60,
                $titleLength === 0 ? 'No se encontró <title>.' : "{$titleLength} caracteres (ideal: hasta ~60).",
                $titleLength > 60,
            ),
            $this->check(
                'description_length',
                'Largo de la descripción',
                $descriptionLength > 0 && $descriptionLength <= 155,
                $descriptionLength === 0 ? 'No se encontró meta description.' : "{$descriptionLength} caracteres (ideal: hasta ~155).",
                $descriptionLength > 155,
            ),
            $this->check(
                'keywords',
                'Palabras clave',
                filled($settings->keywords) && count($settings->keywords) >= 3,
                filled($settings->keywords) ? count($settings->keywords).' cargadas.' : 'No hay ninguna cargada.',
            ),
            $this->check('canonical', 'URL canónica', filled($tags['canonical']), filled($tags['canonical']) ? 'Presente.' : 'No se encontró.'),
            $this->check('favicon', 'Favicon', filled($settings->favicon_path), filled($settings->favicon_path) ? 'Personalizado.' : 'Usando el favicon estático del proyecto.'),
            $this->check('og_image', 'Imagen para compartir (OpenGraph)', filled($tags['og_image']), filled($tags['og_image']) ? 'Presente.' : 'No se encontró.'),
            $this->check('json_ld', 'Datos estructurados (JSON-LD)', ($tags['json_ld_count'] ?? 0) > 0, ($tags['json_ld_count'] ?? 0).' bloque(s) encontrado(s).'),
            $this->check('logo', 'Logo', filled($settings->logo_path), filled($settings->logo_path) ? 'Cargado.' : 'No hay logo cargado.'),
            $this->check('social', 'Redes sociales', filled($settings->socialLinks()), count($settings->socialLinks()).' red(es) cargada(s).'),
        ];
    }

    /**
     * @return array{key: string, label: string, status: string, detail: string}
     */
    private function check(string $key, string $label, bool $ok, string $detail, bool $warnInstead = false): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'status' => $ok ? 'ok' : ($warnInstead ? 'warn' : 'fail'),
            'detail' => $detail,
        ];
    }

    /**
     * Comentario cualitativo con el proveedor de texto activo (el mismo que
     * ya se usa para redactar artículos y analizar la bandeja) — no es una
     * capacidad nueva a activar aparte, reutiliza el que ya tengas puesto.
     *
     * @param  array<string, mixed>  $tags
     * @param  array<int, array{key: string, label: string, status: string, detail: string}>  $checks
     */
    private function aiReview(array $tags, array $checks): ?string
    {
        $provider = AiProvider::where('is_active', true)->first();

        if (! $provider || ! $provider->hasApiKey()) {
            return null;
        }

        $checksSummary = collect($checks)
            ->map(fn ($check) => "- {$check['label']}: {$check['status']} ({$check['detail']})")
            ->implode("\n");

        $prompt = <<<PROMPT
            Sos un consultor SEO. Evaluá el head de este sitio de noticias de anime/gaming y dame feedback breve y accionable en español.

            Título actual: {$tags['title']}
            Descripción actual: {$tags['description']}

            Checklist automático ya calculado:
            {$checksSummary}

            Devolvé como máximo 4 líneas: qué está bien, qué priorizar primero, y una sugerencia concreta de mejora (no repitas el checklist tal cual, agregá valor). Sin encabezados ni markdown, texto plano.
            PROMPT;

        try {
            $response = Prism::text()
                ->using($provider->provider, $provider->default_model, [
                    'api_key' => $provider->api_key,
                ])
                ->withPrompt($prompt)
                ->asText();

            AiUsageLogger::record('seo_audit', $provider->provider, $provider->default_model, $response->usage);

            return trim($response->text);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Genera una versión corregida de título, descripción y palabras clave
     * a partir de lo que la auditoría encontró — para que el admin no
     * tenga que redactarlas a mano, solo revisar y guardar. Solo cubre lo
     * que un texto puede arreglar (no logo/favicon/imagen OG, que son
     * archivos que hay que subir).
     *
     * @param  array<string, mixed>  $tags
     * @param  array<int, array{key: string, label: string, status: string, detail: string}>  $checks
     * @return array{seo_title: string, description: string, keywords: array<int, string>}|null
     */
    public function suggestFixes(SiteSetting $settings, array $tags, array $checks): ?array
    {
        $provider = AiProvider::where('is_active', true)->first();

        if (! $provider || ! $provider->hasApiKey()) {
            return null;
        }

        $checksSummary = collect($checks)
            ->map(fn ($check) => "- {$check['label']}: {$check['status']} ({$check['detail']})")
            ->implode("\n");

        $currentKeywords = filled($settings->keywords) ? implode(', ', $settings->keywords) : '(ninguna cargada)';

        $prompt = <<<PROMPT
            Sos un consultor SEO. A partir de este sitio de noticias de anime, manga y videojuegos, redactá una versión mejorada del título para Google, la descripción y las palabras clave — pensada para arreglar lo que el checklist marcó como falla o advertencia.

            Título actual: {$tags['title']}
            Descripción actual: {$tags['description']}
            Palabras clave actuales: {$currentKeywords}

            Checklist automático:
            {$checksSummary}

            Devolvé la respuesta EXACTAMENTE en este formato, sin texto adicional:
            TITULO: (hasta 60 caracteres, atractivo para buscar en Google, sin comillas)
            DESCRIPCION: (hasta 155 caracteres, resume el sitio y da ganas de entrar)
            PALABRAS_CLAVE: (3 a 6 palabras o frases cortas separadas por coma, sin el símbolo #)
            PROMPT;

        try {
            $response = Prism::text()
                ->using($provider->provider, $provider->default_model, [
                    'api_key' => $provider->api_key,
                ])
                ->withPrompt($prompt)
                ->asText();

            AiUsageLogger::record('seo_audit', $provider->provider, $provider->default_model, $response->usage);

            return $this->parseFixSuggestion($response->text, $settings);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array{seo_title: string, description: string, keywords: array<int, string>}
     */
    private function parseFixSuggestion(string $text, SiteSetting $settings): array
    {
        preg_match('/TITULO:\s*(.+)/i', $text, $titleMatch);
        preg_match('/DESCRIPCION:\s*(.+?)(?=PALABRAS_CLAVE:|$)/is', $text, $descriptionMatch);
        preg_match('/PALABRAS_CLAVE:\s*(.+)/i', $text, $keywordsMatch);

        $keywords = isset($keywordsMatch[1])
            ? collect(explode(',', $keywordsMatch[1]))
                ->map(fn (string $keyword) => trim($keyword, " \t\n\r\0\x0B#."))
                ->filter()
                ->values()
                ->all()
            : $settings->keywords;

        return [
            'seo_title' => trim($titleMatch[1] ?? '') ?: $settings->seoTitle(),
            'description' => Str::squish(trim($descriptionMatch[1] ?? '')) ?: (string) $settings->description,
            'keywords' => $keywords ?: [],
        ];
    }
}
