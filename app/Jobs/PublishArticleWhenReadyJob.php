<?php

namespace App\Jobs;

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Services\Admin\NewsArticleService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Último eslabón de la cadena que arma NewsArticleService::createFromCluster():
 * corre después de generar la portada y la narración (si están activadas), y
 * publica el borrador — así el admin no tiene que entrar a apretar
 * "Publicar" a mano después de aceptar una noticia.
 *
 * Si todavía se está generando la portada con IA, espera (se vuelve a
 * encolar cada WAIT_SECONDS, hasta MAX_WAIT_ROUNDS veces) para no publicar
 * la nota sin imagen. Pasado ese tope publica igual: la decisión de
 * publicar ya se tomó al aceptar el cluster, no puede quedar trabada
 * porque la imagen automática haya fallado en silencio.
 */
class PublishArticleWhenReadyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public const WAIT_SECONDS = 45;

    public const MAX_WAIT_ROUNDS = 8;

    public int $timeout = 60;

    public function __construct(
        public readonly int $newsArticleId,
        public readonly int $waitedRounds = 0,
    ) {}

    public function handle(NewsArticleService $newsArticleService): void
    {
        $article = NewsArticle::find($this->newsArticleId);

        if (! $article) {
            return;
        }

        if ($this->shouldWaitForImage($article)) {
            self::dispatch($article->id, $this->waitedRounds + 1)
                ->delay(now()->addSeconds(self::WAIT_SECONDS));

            return;
        }

        $newsArticleService->publishIfDraft($article);
    }

    private function shouldWaitForImage(NewsArticle $article): bool
    {
        return $article->status === 'draft'
            && blank($article->featured_image)
            && $this->waitedRounds < self::MAX_WAIT_ROUNDS
            && AiProvider::where('is_active_for_images', true)
                ->where('auto_generate_featured_image', true)
                ->exists();
    }
}
