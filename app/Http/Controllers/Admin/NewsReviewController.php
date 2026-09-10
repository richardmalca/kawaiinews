<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\NewsClusterResource;
use App\Jobs\AcceptNewsClusterJob;
use App\Jobs\AnalyzeNewsClustersJob;
use App\Jobs\ApplyAiVerdictsJob;
use App\Jobs\ScrapeNewsSourcesJob;
use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Services\Admin\NewsClusterService;
use App\Support\JobRunStatus;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsReviewController extends Controller
{
    public function __construct(private readonly NewsClusterService $newsClusterService) {}

    private const PER_PAGE = 20;

    public function index(Request $request): Response
    {
        $sort = $request->string('sort', 'relevance')->value();
        $category = $request->string('category')->value() ?: null;
        $page = max(1, $request->integer('page', 1));

        $clusters = $this->newsClusterService->reviewQueue($sort, $category, self::PER_PAGE, $page);

        return Inertia::render('admin/news-review/index', [
            'clusters' => NewsClusterResource::collection($clusters->items())->resolve(),
            'hasActiveSources' => $this->hasScrapableSources(),
            'hasPublishVerdicts' => NewsCluster::where('status', 'pending')->where('ai_verdict', 'publish')->exists(),
            'sort' => $sort,
            'category' => $category,
            'categories' => array_keys(config('news_sources_catalog')),
            'meta' => [
                'current_page' => $clusters->currentPage(),
                'last_page' => $clusters->lastPage(),
                'total' => $clusters->total(),
            ],
            'nextScrapeAt' => $this->nextScheduledRun('news:scrape'),
            'nextAutoReviewAt' => $this->nextScheduledRun('news:auto-review'),
        ]);
    }

    /**
     * Cuándo corre la próxima vez `news:scrape`/`news:auto-review` según el
     * schedule real de routes/console.php (Schedule::events()), no un
     * cálculo manual del cron — así nunca queda desactualizado si el
     * horario cambia ahí.
     *
     * @return array{at: string, in: string}|null
     */
    private function nextScheduledRun(string $commandName): ?array
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($event) => str_contains($event->command ?? '', $commandName));

        if (! $event) {
            return null;
        }

        $nextRun = $event->nextRunDate();

        return [
            'at' => $nextRun->format('H:i'),
            'in' => $nextRun->diffForHumans(),
        ];
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

        $runId = JobRunStatus::start();

        ScrapeNewsSourcesJob::dispatch($runId);

        return response()->json(['run_id' => $runId]);
    }

    public function analyze(): JsonResponse
    {
        $runId = JobRunStatus::start();

        AnalyzeNewsClustersJob::dispatch($runId);

        return response()->json(['run_id' => $runId]);
    }

    public function applyAiVerdicts(): JsonResponse
    {
        $runId = JobRunStatus::start();

        ApplyAiVerdictsJob::dispatch($runId);

        return response()->json(['run_id' => $runId]);
    }

    public function runStatus(string $runId): JsonResponse
    {
        return response()->json(JobRunStatus::get($runId));
    }

    private function hasScrapableSources(): bool
    {
        return NewsSource::where('is_active', true)->whereNotNull('rss_url')->exists();
    }

    public function accept(NewsCluster $newsCluster, Request $request): JsonResponse
    {
        $runId = JobRunStatus::start();

        AcceptNewsClusterJob::dispatch($runId, $newsCluster, $request->user()->id);

        return response()->json(['run_id' => $runId]);
    }

    public function reject(NewsCluster $newsCluster): RedirectResponse
    {
        $this->newsClusterService->reject($newsCluster);

        return to_route('admin.news-review.index');
    }
}
