<?php

namespace App\Jobs;

use App\Models\NewsArticle;
use App\Services\Admin\MediaLibraryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class GenerateArticleFeaturedImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 150;

    public function __construct(public readonly int $newsArticleId) {}

    public function handle(MediaLibraryService $mediaLibraryService): void
    {
        $article = NewsArticle::find($this->newsArticleId);

        if (! $article) {
            return;
        }

        try {
            $mediaLibraryService->generateFeaturedImage($article);
        } catch (Throwable) {
            // Falla en silencio: es una generación automática de fondo,
            // no una acción que el admin esté esperando en pantalla. Si
            // falla, el artículo simplemente queda sin portada y se puede
            // generar una a mano desde el editor, como siempre.
        }
    }
}
