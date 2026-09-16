<?php

namespace App\Support;

/**
 * Utilidades chicas para links de YouTube, compartidas entre el embed de
 * video del cuerpo de la noticia (NewsArticleService) y la referencia
 * visual de respaldo para generar la imagen de portada cuando la fuente
 * no trajo ninguna foto propia (MediaLibraryService::generateFeaturedImage).
 */
class YoutubeVideo
{
    public static function id(string $url): ?string
    {
        if (preg_match('#(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})#i', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * hqdefault siempre existe para cualquier video subido (a diferencia
     * de maxresdefault, que puede no estar disponible), así que es la
     * opción segura para usar como referencia visual.
     */
    public static function thumbnailUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $id = self::id($url);

        return $id ? "https://img.youtube.com/vi/{$id}/hqdefault.jpg" : null;
    }
}
