<?php

namespace App\Jobs;

use App\Services\Admin\NewsClusterService;
use App\Support\JobRunStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class AnalyzeNewsClustersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public int $tries = 1;

    public function __construct(public readonly string $runId) {}

    public function handle(NewsClusterService $newsClusterService): void
    {
        try {
            $result = $newsClusterService->analyzeWithAi();

            JobRunStatus::complete($this->runId, $result);
        } catch (Throwable $exception) {
            JobRunStatus::fail($this->runId, $exception->getMessage());
        }
    }
}
