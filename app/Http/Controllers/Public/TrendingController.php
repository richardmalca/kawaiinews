<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Services\Public\NewsService;
use Inertia\Inertia;
use Inertia\Response;

class TrendingController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService
    ) {}

    public function __invoke(): Response
    {
        $articles = $this->newsService->getPaginatedTrending(perPage: 12);
        $categories = $this->newsService->getCategoriesSummary();

        return Inertia::render('public/trending/index', [
            'articles' => NewsArticleResource::collection($articles),
            'categories' => $categories,
        ]);
    }
}
