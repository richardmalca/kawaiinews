<?php

namespace App\Jobs;

use App\Services\Admin\MediaLibraryService;
use App\Support\JobRunStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class MigrateMediaStorageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 900;

    public function __construct(
        public readonly string $runId,
        public readonly string $direction,
    ) {}

    public function handle(MediaLibraryService $mediaLibraryService): void
    {
        try {
            $result = $mediaLibraryService->migrateAll($this->direction);

            JobRunStatus::complete($this->runId, $result);
        } catch (Throwable $exception) {
            JobRunStatus::fail($this->runId, $exception->getMessage());
        }
    }
}
