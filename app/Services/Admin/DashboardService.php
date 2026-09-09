<?php

namespace App\Services\Admin;

use App\Models\NewsArticle;
use App\Models\User;
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
