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
        $safeContext = Str::limit($plainBody, 200, '');

        $categoryStyle = $article->category === 'gaming'
            ? 'Stylized video game promotional concept art, vibrant dynamic digital gaming illustration, game atmosphere'
            : 'Official 2D Japanese anime key visual illustration, authentic modern animation aesthetic, crisp lineart, cel-shaded coloring, studio animation quality';

        return "Cinematic editorial illustration in 16:9 widescreen format inspired by the topic: {$title}. Theme: {$safeExcerpt}. Background atmosphere: {$safeContext}. Art style: {$categoryStyle}, cinematic lighting, colorful scenic environment. Strict constraints: completely textless, no letters, no words, no logos, no watermarks, no subtitles, peaceful fictional video game or anime artwork, no violence, no gore, no realistic human photos.";
    }
}
