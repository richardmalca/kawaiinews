<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Versión de invalidación para la caché de consultas públicas
 * (App\Services\Public\NewsService). El driver de caché por defecto de
 * este proyecto (`database`) no soporta tags, así que en vez de borrar
 * claves puntuales se usa un número de versión: cada clave de caché lo
 * incluye, y bump() lo incrementa para que todas las claves viejas queden
 * huérfanas (expiran solas por TTL) sin tener que rastrearlas una por una.
 */
class PublicNewsCacheVersion
{
    private const KEY = 'public-news-cache-version';

    public static function current(): int
    {
        return (int) Cache::get(self::KEY, 1);
    }

    public static function bump(): void
    {
        if (! Cache::has(self::KEY)) {
            Cache::forever(self::KEY, 1);
        }

        Cache::increment(self::KEY);
    }
}
