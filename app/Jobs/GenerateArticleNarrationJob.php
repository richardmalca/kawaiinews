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

class GenerateArticleNarrationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 150;

    public function __construct(public readonly int $newsArticleId) {}

    public function handle(MediaLibraryService $mediaLibraryService): void
    {
        $article = NewsArticle::find($this->newsArticleId);

        if (! $article || filled($article->audio_url)) {
            return;
        }

        try {
            $media = $mediaLibraryService->generateNarration($article);

            // Se vuelve a chequear acá (no solo al principio) por si
            // alguien cargó un audio a mano mientras se generaba este.
            $article->refresh();

            if (blank($article->audio_url)) {
                $article->update(['audio_url' => $media->url]);
            }
        } catch (Throwable) {
            // Falla en silencio, igual que la generación automática de
            // portada: es de fondo, no algo que el admin esté esperando
            // en pantalla. Si falla, se puede generar a mano después.
        }
    }
}
