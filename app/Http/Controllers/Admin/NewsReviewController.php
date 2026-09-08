<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsClusterResource;
use App\Models\NewsCluster;
use App\Services\NewsArticleService;
use App\Services\NewsClusterService;
use App\Services\NewsScraperService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NewsReviewController extends Controller
{
    public function __construct(
        private readonly NewsClusterService $newsClusterService,
        private readonly NewsScraperService $newsScraperService,
        private readonly NewsArticleService $newsArticleService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/news-review/index', [
            'clusters' => NewsClusterResource::collection($this->newsClusterService->reviewQueue())->resolve(),
        ]);
    }

    public function scrape(): JsonResponse
    {
        $result = $this->newsScraperService->run();

        return response()->json($result);
    }

    public function accept(NewsCluster $newsCluster): RedirectResponse
    {
        $this->newsClusterService->accept($newsCluster);
        $article = $this->newsArticleService->createFromCluster($newsCluster);

        return to_route('admin.news-articles.edit', $article);
    }

    public function reject(NewsCluster $newsCluster): RedirectResponse
    {
        $this->newsClusterService->reject($newsCluster);

        return to_route('admin.news-review.index');
    }
}
