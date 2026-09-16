<?php

namespace App\Support;

use App\Models\NewsArticle;
use Illuminate\Support\Str;

/**
 * Arma el mismo prompt de imagen que usa el botón "Generar con IA" /
 * "Copiar prompt para otra IA" del editor (ver aiImagePrompt en
 * resources/js/pages/admin/news-articles/edit.tsx), pero del lado del
 * servidor — para poder generar la imagen de portada automáticamente al
 * crear el artículo, sin depender de que alguien tenga el editor
 * abierto en el navegador.
 */
class ArticleImagePromptBuilder
{
    public static function build(NewsArticle $article): ?string
    {
        $title = trim(str_replace(['"', '“', '”'], '', $article->title));
        $excerpt = trim(str_replace(['"', '“', '”'], '', (string) $article->excerpt));
        $plainBody = trim(preg_replace('/\s+/', ' ', strip_tags((string) $article->body)) ?? '');

        if ($title === '' || $excerpt === '' || $plainBody === '') {
            return null;
        }

        $safeExcerpt = Str::limit($excerpt, 180, '');

        $categoryStyle = $article->category === 'gaming'
            ? 'Stylized video game promotional concept art, vibrant dynamic digital gaming illustration, game atmosphere'
            : 'Official 2D Japanese anime key visual illustration, authentic modern animation aesthetic, crisp lineart, cel-shaded coloring, studio animation quality';

        // A propósito NO se manda el cuerpo completo de la noticia: habla
        // de mecánica periodística (tráilers, streams, capturas de
        // pantalla, retrasos) que la IA toma literal y termina dibujando
        // pantallas, grabaciones o los mismos personajes duplicados en
        // dos escenas — justo lo que no queremos en una portada. Solo se
        // usa el título y el resumen como inspiración temática.
        //
        // Este builder solo lo usa MediaLibraryService::generateFeaturedImage(),
        // que siempre manda la imagen oficial de la fuente como
        // referencia (nunca se llama sin una) — por eso el prompt le
        // pide que se apegue a esa referencia en vez de reinterpretarla
        // libremente: cuando ya hay una foto oficial, el admin prefiere
        // una versión fiel de esa escena antes que una inventada.
        return "Single cohesive key visual illustration in 16:9 widescreen format, poster-style composition with one clear focal point. Closely follow the composition, characters, poses and framing of the provided reference image — this should read as a faithful stylized redraw of that same scene, not a different or reinterpreted scene. Capturing the mood of: {$title}. Feeling: {$safeExcerpt}. Art style: {$categoryStyle}, cinematic lighting, rich colorful atmosphere. Strict constraints: exactly one self-contained scene, no screens, no monitors, no TV frames, no cameras, no recording devices, no picture-in-picture, no frame-within-frame compositions, no duplicated or repeated characters, no crowds of near-identical figures, completely textless, no letters, no words, no logos, no watermarks, no subtitles, peaceful artwork only, no violence, no gore, no realistic human photos.";
    }
}
