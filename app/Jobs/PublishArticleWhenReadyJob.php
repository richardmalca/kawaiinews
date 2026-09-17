<?php

namespace App\Jobs;

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
 * "Publicar" a mano después de aceptar una noticia. Si ambas generaciones
 * fallan en silencio (como ya hacen esos jobs), esto igual publica: la
 * decisión de publicar ya se tomó al aceptar el cluster, no depende de que
 * la imagen/audio automáticos hayan salido bien.
 */
class PublishArticleWhenReadyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;

    public function __construct(public readonly int $newsArticleId) {}

    public function handle(NewsArticleService $newsArticleService): void
    {
        $article = NewsArticle::find($this->newsArticleId);

        if (! $article) {
            return;
        }

        $newsArticleService->publishIfDraft($article);
    }
}
