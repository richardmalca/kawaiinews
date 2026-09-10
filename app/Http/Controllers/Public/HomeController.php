<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Services\Public\NewsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $user = $request->user();
        $isFollowingCategory = false;
        $categoryFollowersCount = 0;

        if ($selectedCategory) {
            $isFollowingCategory = $user ? $user->isFollowingCategory($selectedCategory) : false;
            $categoryFollowersCount = DB::table('category_user')
                ->where('category', $selectedCategory)
                ->count();
        }

        return Inertia::render('public/home/index', [
            'featured' => NewsArticleResource::collection($featuredArticles),
            'articles' => NewsArticleResource::collection($paginatedArticles),
            'trending' => NewsArticleResource::collection($trendingTopics),
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
            'isFollowingCategory' => $isFollowingCategory,
            'categoryFollowersCount' => $categoryFollowersCount,
            'search' => $search,
        ]);
    }
}
