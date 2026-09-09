<?php

namespace App\Jobs;

use App\Http\Resources\Admin\MediaResource;
use App\Models\NewsArticle;
use App\Services\Admin\MediaLibraryService;
use App\Support\FriendlyAiError;
use App\Support\JobRunStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class GenerateAudioJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 150;

    public function __construct(
        public readonly string $runId,
        public readonly NewsArticle $newsArticle,
    ) {}

    public function handle(MediaLibraryService $mediaLibraryService): void
    {
        try {
            $media = $mediaLibraryService->generateNarration($this->newsArticle);

            JobRunStatus::complete($this->runId, (new MediaResource($media))->resolve());
        } catch (Throwable $exception) {
            JobRunStatus::fail($this->runId, FriendlyAiError::forException($exception));
        }
    }
}
