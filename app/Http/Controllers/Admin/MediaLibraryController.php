<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateMediaRequest;
use App\Http\Requests\Admin\StoreAudioUploadRequest;
use App\Http\Requests\Admin\StoreMediaFromUrlRequest;
use App\Http\Requests\Admin\StoreMediaUploadRequest;
use App\Http\Resources\Admin\MediaResource;
use App\Jobs\GenerateAudioJob;
use App\Jobs\GenerateMediaJob;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Services\Admin\MediaLibraryService;
use App\Support\JobRunStatus;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaLibraryController extends Controller
{
    public function __construct(private readonly MediaLibraryService $mediaLibraryService) {}

    public function index(): JsonResponse
    {
        return response()->json(
            MediaResource::collection($this->mediaLibraryService->list())->resolve()
        );
    }

    public function libraryIndex(): Response
    {
        return Inertia::render('admin/media-library/index', [
            'images' => MediaResource::collection($this->mediaLibraryService->list())->resolve(),
            'audios' => MediaResource::collection($this->mediaLibraryService->listAudio())->resolve(),
        ]);
    }

    public function audioList(): JsonResponse
    {
        return response()->json(
            MediaResource::collection($this->mediaLibraryService->listAudio())->resolve()
        );
    }

    public function store(StoreMediaUploadRequest $request): JsonResponse
    {
        $media = $this->mediaLibraryService->storeUpload(
            $request->file('file'),
            $request->validated('news_article_id'),
        );

        return response()->json((new MediaResource($media))->resolve());
    }

    public function storeAudio(StoreAudioUploadRequest $request): JsonResponse
    {
        $media = $this->mediaLibraryService->storeAudioUpload(
            $request->file('file'),
            $request->validated('news_article_id'),
        );

        return response()->json((new MediaResource($media))->resolve());
    }

    public function storeFromUrl(StoreMediaFromUrlRequest $request): JsonResponse
    {
        $media = $this->mediaLibraryService->storeFromUrl(
            $request->validated('url'),
            $request->validated('news_article_id'),
        );

        return response()->json((new MediaResource($media))->resolve());
    }

    public function generate(GenerateMediaRequest $request): JsonResponse
    {
        $runId = JobRunStatus::start();

        GenerateMediaJob::dispatch($runId, $request->validated('prompt'), $request->validated('news_article_id'));

        return response()->json(['run_id' => $runId]);
    }

    public function generateAudio(NewsArticle $newsArticle): JsonResponse
    {
        $runId = JobRunStatus::start();

        GenerateAudioJob::dispatch($runId, $newsArticle);

        return response()->json(['run_id' => $runId]);
    }

    public function download(Media $media): BinaryFileResponse|StreamedResponse
    {
        return $this->mediaLibraryService->download($media);
    }

    public function destroy(Media $media): JsonResponse
    {
        $this->mediaLibraryService->delete($media);

        return response()->json(['deleted' => true]);
    }
}
