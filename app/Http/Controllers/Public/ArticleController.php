<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Services\Public\ArticleViewService;
use App\Services\Public\NewsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService,
        private readonly ArticleViewService $articleViewService,
    ) {}

    public function show(Request $request, string $slug): Response
    {
        $article = $this->newsService->findPublishedBySlug($slug);

        $this->articleViewService->record($article, $request);

        $related = $this->newsService->getRelatedArticles($article, limit: 3);
        $trending = $this->newsService->getTrendingTopics(limit: 5);
        $categories = $this->newsService->getCategoriesSummary();

        return Inertia::render('public/articles/show', [
            'article' => new NewsArticleResource($article),
            'related' => NewsArticleResource::collection($related),
            'trending' => NewsArticleResource::collection($trending),
            'categories' => $categories,
        ]);
    }
}
