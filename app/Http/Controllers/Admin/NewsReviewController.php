<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\NewsClusterResource;
use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Services\Admin\NewsArticleService;
use App\Services\Admin\NewsClusterService;
use App\Services\Admin\NewsScraperService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsReviewController extends Controller
{
    public function __construct(
        private readonly NewsClusterService $newsClusterService,
        private readonly NewsScraperService $newsScraperService,
        private readonly NewsArticleService $newsArticleService,
    ) {}

    private const PER_PAGE = 20;

    public function index(Request $request): Response
    {
        $sort = $request->string('sort', 'relevance')->value();
        $category = $request->string('category')->value() ?: null;
        $page = max(1, $request->integer('page', 1));

        $clusters = $this->newsClusterService->reviewQueue($sort, $category);
        $total = $clusters->count();
        $items = $clusters->forPage($page, self::PER_PAGE)->values();

        return Inertia::render('admin/news-review/index', [
            'clusters' => NewsClusterResource::collection($items)->resolve(),
            'hasActiveSources' => $this->hasScrapableSources(),
            'sort' => $sort,
            'category' => $category,
            'categories' => array_keys(config('news_sources_catalog')),
            'meta' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / self::PER_PAGE)),
                'total' => $total,
            ],
        ]);
    }

    public function scrape(): JsonResponse
    {
        if (! $this->hasScrapableSources()) {
            return response()->json([
                'sources_scraped' => 0,
                'items_found' => 0,
                'items_new' => 0,
                'errors' => ['No hay fuentes activas con RSS configurado. Activa alguna en Fuentes de noticias.'],
            ]);
        }

        $result = $this->newsScraperService->run();

        return response()->json($result);
    }

    public function analyze(): JsonResponse
    {
        return response()->json($this->newsClusterService->analyzeWithAi());
    }

    private function hasScrapableSources(): bool
    {
        return NewsSource::where('is_active', true)->whereNotNull('rss_url')->exists();
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
