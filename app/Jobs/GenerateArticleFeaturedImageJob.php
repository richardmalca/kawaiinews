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

    /**
     * Cuántos intentos totales dentro de esta misma corrida del job — no
     * confundir con $tries (reintentos de la cola): esto es para fallas
     * transitorias del proveedor de IA (timeout, rate limit puntual) que
     * suelen resolverse solas al toque, no para reintentar indefinidamente.
     */
    private const MAX_ATTEMPTS = 2;

    public function handle(MediaLibraryService $mediaLibraryService): void
    {
        $article = NewsArticle::find($this->newsArticleId);

        if (! $article) {
            return;
        }

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            try {
                $mediaLibraryService->generateFeaturedImage($article);

                return;
            } catch (Throwable) {
                // Falla en silencio: es una generación automática de
                // fondo, no una acción que el admin esté esperando en
                // pantalla. Si ya tiene portada (la generó justo antes de
                // que algo más tirara una excepción) o se acabaron los
                // intentos, dejamos que el artículo quede sin portada —
                // se puede generar una a mano desde el editor, como
                // siempre. Si no, un segundo intento suele alcanzar para
                // las fallas transitorias del proveedor de IA.
                $article->refresh();

                if (filled($article->featured_image) || $attempt === self::MAX_ATTEMPTS) {
                    return;
                }

                sleep(5);
            }
        }
    }
}
