<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Services\Public\NewsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService
    ) {}

    public function __invoke(Request $request, ?string $category = null): Response
    {
        $selectedCategory = $category ?? $request->query('categoria');
        $search = $request->query('q');

        $featuredArticles = $this->newsService->getFeatured(limit: 4);
        $paginatedArticles = $this->newsService->getPaginatedArticles(
            category: $selectedCategory,
            search: $search,
            perPage: 9,
        );
        $trendingTopics = $this->newsService->getTrendingTopics(limit: 6);
        $categories = $this->newsService->getCategoriesSummary();

        return Inertia::render('public/home/index', [
            'featured' => NewsArticleResource::collection($featuredArticles),
            'articles' => NewsArticleResource::collection($paginatedArticles),
            'trending' => NewsArticleResource::collection($trendingTopics),
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
            'search' => $search,
        ]);
    }
}
