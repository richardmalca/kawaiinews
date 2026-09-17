<?php

namespace App\Jobs;

use App\Models\NewsCluster;
use App\Services\Admin\NewsArticleService;
use App\Services\Admin\NewsClusterService;
use App\Support\ActivityLogger;
use App\Support\JobRunStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class AcceptNewsClusterJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 150;

    public int $tries = 1;

    public function __construct(
        public readonly string $runId,
        public readonly NewsCluster $newsCluster,
        public readonly ?int $authorId = null,
    ) {}

    public function handle(NewsClusterService $newsClusterService, NewsArticleService $newsArticleService): void
    {
        try {
            $newsClusterService->accept($this->newsCluster);
            $article = $newsArticleService->createFromCluster($this->newsCluster, $this->authorId);

            ActivityLogger::log(
                'news_cluster.accepted',
                $this->newsCluster,
                "Aceptó \"{$this->newsCluster->title}\" y generó el borrador \"{$article->title}\"",
                $this->authorId,
            );

            JobRunStatus::complete($this->runId, ['article_id' => $article->id]);
        } catch (Throwable $exception) {
            JobRunStatus::fail($this->runId, $exception->getMessage());
        }
    }

    /**
     * Laravel llama esto cuando el job muere ANTES de que handle() llegue a
     * correr (ej. MaxAttemptsExceededException si el worker se reinició a
     * mitad de camino, o se agotó el timeout) — el try/catch de adentro de
     * handle() no cubre esos casos, y sin esto el frontend se queda
     * esperando un runId que nunca va a completarse hasta que expire el
     * caché (15 minutos), pareciendo colgado en vez de fallado.
     */
    public function failed(Throwable $exception): void
    {
        JobRunStatus::fail($this->runId, $exception->getMessage());
    }
}
