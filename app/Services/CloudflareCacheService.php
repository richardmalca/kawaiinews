<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Purga URLs puntuales de la caché de borde de Cloudflare. Se usa cuando
 * una página pública queda cacheada ahí (ver EdgeCacheForGuests) y su
 * contenido cambia antes de que el TTL expire solo — por ejemplo, al
 * publicar o editar un artículo.
 *
 * Si no hay credenciales configuradas (CLOUDFLARE_API_TOKEN /
 * CLOUDFLARE_ZONE_ID), no hace nada: la página igual se sirve fresca una
 * vez que el TTL del borde vence, así que esto es una optimización, no un
 * requisito para que el sitio funcione.
 */
class CloudflareCacheService
{
    public function purgeUrls(array $urls): void
    {
        $urls = array_values(array_unique(array_filter($urls)));

        if ($urls === []) {
            return;
        }

        $token = config('services.cloudflare.api_token');
        $zoneId = config('services.cloudflare.zone_id');

        if (blank($token) || blank($zoneId)) {
            return;
        }

        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->post("https://api.cloudflare.com/client/v4/zones/{$zoneId}/purge_cache", [
                    'files' => $urls,
                ]);

            if (! $response->successful()) {
                Log::warning('No se pudo purgar la caché de Cloudflare', [
                    'urls' => $urls,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (Throwable $e) {
            Log::warning('Error al purgar la caché de Cloudflare', [
                'urls' => $urls,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
