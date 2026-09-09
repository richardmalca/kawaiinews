<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateMediaRequest;
use App\Http\Requests\Admin\StoreMediaFromUrlRequest;
use App\Http\Requests\Admin\StoreMediaUploadRequest;
use App\Http\Resources\Admin\MediaResource;
use App\Models\Media;
use App\Services\Admin\MediaLibraryService;
use Illuminate\Http\JsonResponse;
use Throwable;

class MediaLibraryController extends Controller
{
    public function __construct(private readonly MediaLibraryService $mediaLibraryService) {}

    public function index(): JsonResponse
    {
        return response()->json(
            MediaResource::collection($this->mediaLibraryService->list())->resolve()
        );
    }

    public function store(StoreMediaUploadRequest $request): JsonResponse
    {
        $media = $this->mediaLibraryService->storeUpload($request->file('file'));

        return response()->json((new MediaResource($media))->resolve());
    }

    public function storeFromUrl(StoreMediaFromUrlRequest $request): JsonResponse
    {
        $media = $this->mediaLibraryService->storeFromUrl($request->validated('url'));

        return response()->json((new MediaResource($media))->resolve());
    }

    public function generate(GenerateMediaRequest $request): JsonResponse
    {
        try {
            $media = $this->mediaLibraryService->generateWithAi($request->validated('prompt'));

            return response()->json((new MediaResource($media))->resolve());
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function destroy(Media $media): JsonResponse
    {
        $this->mediaLibraryService->delete($media);

        return response()->json(['deleted' => true]);
    }
}
