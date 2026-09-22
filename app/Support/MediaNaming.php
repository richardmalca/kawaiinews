<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Arma el nombre y la carpeta de cada archivo de medios con una sola
 * estructura fija, sin importar si viene de una subida, de una
 * generación con IA o de un traslado/renombrado posterior. Así todos
 * los archivos quedan con el mismo formato en vez de conservar el
 * nombre original con el que llegó cada uno.
 */
class MediaNaming
{
    public static function path(string $type, string $extension): string
    {
        $folder = $type === 'audio' ? 'audio' : 'media';
        $prefix = $type === 'audio' ? 'audio' : 'img';
        $extension = ltrim($extension, '.') ?: ($type === 'audio' ? 'mp3' : 'webp');

        return sprintf(
            '%s/%s-%s-%s.%s',
            $folder,
            $prefix,
            now()->format('Ymd'),
            Str::lower(Str::random(12)),
            $extension,
        );
    }

    /**
     * Deriva, a partir del path de la imagen completa, dónde va su
     * variante chica para listados/cards — mismo nombre con "-card" antes
     * de la extensión, en la misma carpeta.
     */
    public static function cardPath(string $mainPath): string
    {
        $extension = pathinfo($mainPath, PATHINFO_EXTENSION);
        $withoutExtension = $extension !== '' ? Str::beforeLast($mainPath, ".{$extension}") : $mainPath;

        return $withoutExtension.'-card'.($extension !== '' ? ".{$extension}" : '');
    }
}
