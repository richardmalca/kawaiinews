<?php

namespace App\Jobs;

use App\Services\Admin\NewsScraperService;
use App\Support\JobRunStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ScrapeNewsSourcesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function __construct(public readonly string $runId) {}

    public function handle(NewsScraperService $newsScraperService): void
    {
        try {
            $result = $newsScraperService->run();

            JobRunStatus::complete($this->runId, $result);
        } catch (Throwable $exception) {
            JobRunStatus::fail($this->runId, $exception->getMessage());
        }
    }
}
