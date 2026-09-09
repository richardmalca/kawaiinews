<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    private const TIMELINE_DAYS = 14;

    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        $today = now()->toDateString();
        $weekAgo = now()->subDays(6)->toDateString();

        return [
            'users' => [
                'total' => User::count(),
                'new_today' => User::whereDate('created_at', $today)->count(),
                'new_this_week' => User::whereDate('created_at', '>=', $weekAgo)->count(),
            ],
            'views' => [
                'total' => (int) NewsArticle::sum('views_count'),
                'today' => (int) DB::table('article_view_daily')->where('date', $today)->sum('views'),
                'this_week' => (int) DB::table('article_view_daily')->where('date', '>=', $weekAgo)->sum('views'),
            ],
            'reactions_today' => $this->likesCountSince($today) + $this->favoritesCountSince($today),
            'shares_today' => DB::table('shares')->whereDate('created_at', $today)->count(),
            'articles' => [
                'published' => NewsArticle::where('status', 'published')->count(),
                'drafts' => NewsArticle::where('status', 'draft')->count(),
            ],
        ];
    }

    /**
     * Comparativa "esta semana" (últimos 7 días, hoy incluido) contra los 7
     * días anteriores a esos — para saber si se está creciendo o cayendo,
     * no solo el número absoluto.
     *
     * @return array<string, array{current: int, previous: int, change_percent: float|null}>
     */
    public function growth(): array
    {
        $currentStart = now()->subDays(6)->toDateString();
        $previousStart = now()->subDays(13)->toDateString();
        $previousEnd = now()->subDays(7)->toDateString();

        $viewsCurrent = (int) DB::table('article_view_daily')->where('date', '>=', $currentStart)->sum('views');
        $viewsPrevious = (int) DB::table('article_view_daily')
            ->whereBetween('date', [$previousStart, $previousEnd])
            ->sum('views');

        $usersCurrent = User::whereDate('created_at', '>=', $currentStart)->count();
        $usersPrevious = User::whereDate('created_at', '>=', $previousStart)
            ->whereDate('created_at', '<=', $previousEnd)
            ->count();

        $reactionsCurrent = $this->reactionsCountBetween($currentStart, now()->toDateString());
        $reactionsPrevious = $this->reactionsCountBetween($previousStart, $previousEnd);

        return [
            'views' => $this->growthEntry($viewsCurrent, $viewsPrevious),
            'users' => $this->growthEntry($usersCurrent, $usersPrevious),
            'reactions' => $this->growthEntry($reactionsCurrent, $reactionsPrevious),
        ];
    }

    /**
     * Lista de chequeos de salud del sitio: qué está bien, qué está mal, y
     * qué falta configurar. Pensado para verlo de un vistazo sin tener que
     * ir a revisar cada sección del panel por separado.
     *
     * @return array<int, array{status: 'ok'|'warning'|'critical', label: string, detail: string}>
     */
    public function healthChecks(): array
    {
        $checks = [];

        $checks[] = $this->aiProviderCheck();
        $checks[] = $this->newsSourcesCheck();
        $checks[] = $this->reviewQueueCheck();
        $checks[] = $this->scrapingFreshnessCheck();
        $checks[] = $this->queueWorkerCheck();
        $checks[] = $this->articlesWithoutImageCheck();

        return $checks;
    }

    /**
     * @return array{status: 'ok'|'warning'|'critical', label: string, detail: string}
     */
    private function aiProviderCheck(): array
    {
        $active = AiProvider::where('is_active', true)->whereNotNull('api_key')->exists();

        return $active
            ? ['status' => 'ok', 'label' => 'Proveedor de IA', 'detail' => 'Hay un proveedor de texto activo y con API key.']
            : ['status' => 'critical', 'label' => 'Proveedor de IA', 'detail' => 'No hay ningún proveedor de IA activo con API key — no se pueden redactar borradores ni analizar la cola.'];
    }

    /**
     * @return array{status: 'ok'|'warning'|'critical', label: string, detail: string}
     */
    private function newsSourcesCheck(): array
    {
        $active = NewsSource::where('is_active', true)->whereNotNull('rss_url')->count();

        if ($active === 0) {
            return ['status' => 'critical', 'label' => 'Fuentes de noticias', 'detail' => 'No hay ninguna fuente activa con RSS — el scraping no encuentra nada nuevo.'];
        }

        return ['status' => 'ok', 'label' => 'Fuentes de noticias', 'detail' => "{$active} fuente(s) activa(s) con RSS."];
    }

    /**
     * @return array{status: 'ok'|'warning'|'critical', label: string, detail: string}
     */
    private function reviewQueueCheck(): array
    {
        $pending = NewsCluster::where('status', 'pending')->count();

        if ($pending > 100) {
            return ['status' => 'warning', 'label' => 'Bandeja de revisión', 'detail' => "{$pending} clusters pendientes — se está acumulando, revisá o corré el análisis con IA."];
        }

        return ['status' => 'ok', 'label' => 'Bandeja de revisión', 'detail' => "{$pending} cluster(s) esperando revisión."];
    }

    /**
     * @return array{status: 'ok'|'warning'|'critical', label: string, detail: string}
     */
    private function scrapingFreshnessCheck(): array
    {
        $lastScraped = NewsSource::whereNotNull('last_scraped_at')->max('last_scraped_at');

        if (! $lastScraped) {
            return ['status' => 'warning', 'label' => 'Último scraping', 'detail' => 'Todavía no corrió el scraper ninguna vez.'];
        }

        $lastScrapedAt = Carbon::parse($lastScraped);
        $hoursAgo = now()->diffInHours($lastScrapedAt, true);

        if ($hoursAgo > 6) {
            return ['status' => 'warning', 'label' => 'Último scraping', 'detail' => "Hace {$hoursAgo}hs que no se scrapea — revisá el cron (news:scrape corre cada 3hs)."];
        }

        return ['status' => 'ok', 'label' => 'Último scraping', 'detail' => $lastScrapedAt->diffForHumans()];
    }

    /**
     * Diagnóstico directo del incidente real que motivó esto: si hay jobs
     * en la tabla `jobs` esperando desde hace rato, lo más probable es que
     * no haya ningún worker de cola corriendo (o se haya caído).
     *
     * @return array{status: 'ok'|'warning'|'critical', label: string, detail: string}
     */
    private function queueWorkerCheck(): array
    {
        $oldestPendingJob = DB::table('jobs')->min('created_at');

        if (! $oldestPendingJob) {
            return ['status' => 'ok', 'label' => 'Worker de cola', 'detail' => 'No hay jobs pendientes ahora mismo.'];
        }

        // `jobs.created_at` es un timestamp unix (entero), no un datetime —
        // así lo define la migración base de Laravel para esta tabla.
        $minutesWaiting = now()->diffInMinutes(Carbon::createFromTimestamp($oldestPendingJob), true);

        if ($minutesWaiting > 5) {
            return ['status' => 'critical', 'label' => 'Worker de cola', 'detail' => "Hay jobs esperando hace {$minutesWaiting} minutos — el worker de colas probablemente no está corriendo."];
        }

        return ['status' => 'ok', 'label' => 'Worker de cola', 'detail' => 'Los jobs se están procesando normalmente.'];
    }

    /**
     * @return array{status: 'ok'|'warning'|'critical', label: string, detail: string}
     */
    private function articlesWithoutImageCheck(): array
    {
        $missing = NewsArticle::where('status', 'published')
            ->where(fn ($query) => $query->whereNull('featured_image')->orWhere('featured_image', ''))
            ->count();

        if ($missing === 0) {
            return ['status' => 'ok', 'label' => 'Imágenes destacadas', 'detail' => 'Todos los artículos publicados tienen imagen.'];
        }

        return ['status' => 'warning', 'label' => 'Imágenes destacadas', 'detail' => "{$missing} artículo(s) publicado(s) sin imagen destacada."];
    }

    private function reactionsCountBetween(string $start, string $end): int
    {
        $likes = DB::table('likes')
            ->where('likeable_type', NewsArticle::class)
            ->whereRaw('date(created_at) between ? and ?', [$start, $end])
            ->count();

        $favorites = DB::table('favorites')
            ->where('favoriteable_type', NewsArticle::class)
            ->whereRaw('date(created_at) between ? and ?', [$start, $end])
            ->count();

        return $likes + $favorites;
    }

    /**
     * @return array{current: int, previous: int, change_percent: float|null}
     */
    private function growthEntry(int $current, int $previous): array
    {
        return [
            'current' => $current,
            'previous' => $previous,
            'change_percent' => $previous > 0
                ? round((($current - $previous) / $previous) * 100, 1)
                : null,
        ];
    }

    /**
     * @return array<int, array{date: string, views: int, users: int, reactions: int, shares: int}>
     */
    public function timeline(int $days = self::TIMELINE_DAYS): array
    {
        $start = now()->subDays($days - 1)->startOfDay();

        $viewsByDate = DB::table('article_view_daily')
            ->where('date', '>=', $start->toDateString())
            ->selectRaw('date, sum(views) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $usersByDate = User::where('created_at', '>=', $start)
            ->selectRaw($this->dateGroupExpression('created_at').' as day, count(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $likesByDate = DB::table('likes')
            ->where('likeable_type', NewsArticle::class)
            ->where('created_at', '>=', $start)
            ->selectRaw($this->dateGroupExpression('created_at').' as day, count(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $favoritesByDate = DB::table('favorites')
            ->where('favoriteable_type', NewsArticle::class)
            ->where('created_at', '>=', $start)
            ->selectRaw($this->dateGroupExpression('created_at').' as day, count(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $sharesByDate = DB::table('shares')
            ->where('created_at', '>=', $start)
            ->selectRaw($this->dateGroupExpression('created_at').' as day, count(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $timeline = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();

            $timeline[] = [
                'date' => $date,
                'views' => (int) ($viewsByDate[$date] ?? 0),
                'users' => (int) ($usersByDate[$date] ?? 0),
                'reactions' => (int) ($likesByDate[$date] ?? 0) + (int) ($favoritesByDate[$date] ?? 0),
                'shares' => (int) ($sharesByDate[$date] ?? 0),
            ];
        }

        return $timeline;
    }

    /**
     * @return array<int, array{id: int, title: string, slug: string, category: string, views: int, likes: int, favorites: int, shares: int}>
     */
    public function topArticles(int $limit = 8): array
    {
        $likes = DB::table('likes')
            ->where('likeable_type', NewsArticle::class)
            ->selectRaw('likeable_id, count(*) as total')
            ->groupBy('likeable_id')
            ->pluck('total', 'likeable_id');

        $favorites = DB::table('favorites')
            ->where('favoriteable_type', NewsArticle::class)
            ->selectRaw('favoriteable_id, count(*) as total')
            ->groupBy('favoriteable_id')
            ->pluck('total', 'favoriteable_id');

        $shares = DB::table('shares')
            ->selectRaw('news_article_id, count(*) as total')
            ->groupBy('news_article_id')
            ->pluck('total', 'news_article_id');

        return NewsArticle::where('status', 'published')
            ->orderByDesc('views_count')
            ->limit($limit)
            ->get(['id', 'title', 'slug', 'category', 'views_count'])
            ->map(fn (NewsArticle $article) => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'category' => $article->category,
                'views' => $article->views_count,
                'likes' => (int) ($likes[$article->id] ?? 0),
                'favorites' => (int) ($favorites[$article->id] ?? 0),
                'shares' => (int) ($shares[$article->id] ?? 0),
            ])
            ->all();
    }

    /**
     * @return array<int, array{category: string, label: string, articles: int, views: int, likes: int}>
     */
    public function categoryBreakdown(): array
    {
        $catalog = config('news_sources_catalog', []);

        $articleStats = NewsArticle::where('status', 'published')
            ->selectRaw('category, count(*) as articles, sum(views_count) as views')
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $likesByCategory = DB::table('likes')
            ->join('news_articles', 'news_articles.id', '=', 'likes.likeable_id')
            ->where('likes.likeable_type', NewsArticle::class)
            ->selectRaw('news_articles.category, count(*) as total')
            ->groupBy('news_articles.category')
            ->pluck('total', 'category');

        return collect($catalog)
            ->map(function (array $entry, string $key) use ($articleStats, $likesByCategory) {
                $stats = $articleStats->get($key);

                return [
                    'category' => $key,
                    'label' => $entry['label'] ?? ucfirst($key),
                    'articles' => (int) ($stats->articles ?? 0),
                    'views' => (int) ($stats->views ?? 0),
                    'likes' => (int) ($likesByCategory[$key] ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    private function likesCountSince(string $date): int
    {
        return DB::table('likes')
            ->where('likeable_type', NewsArticle::class)
            ->whereDate('created_at', $date)
            ->count();
    }

    private function favoritesCountSince(string $date): int
    {
        return DB::table('favorites')
            ->where('favoriteable_type', NewsArticle::class)
            ->whereDate('created_at', $date)
            ->count();
    }

    /**
     * `date()` funciona igual en SQLite y MySQL para agrupar un datetime por
     * día — evita tener que escribir dos expresiones distintas por motor.
     */
    private function dateGroupExpression(string $column): string
    {
        return "date({$column})";
    }
}
