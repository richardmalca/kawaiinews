<?php

namespace App\Jobs;

use App\Models\NewsCluster;
use App\Services\Admin\NewsArticleService;
use App\Services\Admin\NewsClusterService;
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

            JobRunStatus::complete($this->runId, ['article_id' => $article->id]);
        } catch (Throwable $exception) {
            JobRunStatus::fail($this->runId, $exception->getMessage());
        }
    }
}
