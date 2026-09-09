<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreShareRequest;
use App\Services\Public\ArticleInteractionService;
use App\Services\Public\NewsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleInteractionController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService,
        private readonly ArticleInteractionService $articleInteractionService,
    ) {}

    public function toggleLike(Request $request, string $slug): JsonResponse
    {
        $article = $this->newsService->findPublishedBySlug($slug);

        return response()->json(
            $this->articleInteractionService->toggleLike($request->user(), $article)
        );
    }

    public function toggleFavorite(Request $request, string $slug): JsonResponse
    {
        $article = $this->newsService->findPublishedBySlug($slug);

        return response()->json(
            $this->articleInteractionService->toggleFavorite($request->user(), $article)
        );
    }

    public function share(StoreShareRequest $request, string $slug): JsonResponse
    {
        $article = $this->newsService->findPublishedBySlug($slug);

        $this->articleInteractionService->recordShare(
            $request->user(),
            $article,
            $request->validated('channel'),
        );

        return response()->json(['shared' => true]);
    }
}
