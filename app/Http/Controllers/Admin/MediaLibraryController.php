<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMediaFromUrlRequest;
use App\Http\Requests\Admin\StoreMediaUploadRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Services\MediaLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

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

    public function destroy(Media $media): RedirectResponse
    {
        $this->mediaLibraryService->delete($media);

        return back();
    }
}
