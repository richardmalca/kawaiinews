<?php

namespace App\Services\Public;

use App\Models\NewsArticle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class NewsService
{
    /**
     * @return Collection<int, NewsArticle>
     */
    public function getFeatured(int $limit = 5): Collection
    {
        return NewsArticle::query()
            ->with('tags')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->take($limit)
            ->get();
    }

    public function getPaginatedArticles(?string $category = null, ?string $search = null, int $perPage = 12): LengthAwarePaginator
    {
        return NewsArticle::query()
            ->with('tags')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->when($category, fn ($query, $cat) => $query->where('category', $cat))
            ->when($search, function ($query, $term) {
                $query->where(function ($q) use ($term) {
                    $q->where('title', 'like', "%{$term}%")
                        ->orWhere('excerpt', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('published_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @return Collection<int, NewsArticle>
     */
    public function getTrendingTopics(int $limit = 6): Collection
    {
        return NewsArticle::query()
            ->with('tags')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->take($limit)
            ->get();
    }

    /**
     * @return array<string, array{label: string, count: int}>
     */
    public function getCategoriesSummary(): array
    {
        $catalog = config('news_sources_catalog', []);
        $counts = NewsArticle::query()
            ->where('status', 'published')
            ->selectRaw('category, count(*) as total')
            ->groupBy('category')
            ->pluck('total', 'category')
            ->all();

        $result = [];
        foreach ($catalog as $key => $data) {
            $result[$key] = [
                'label' => $data['label'] ?? ucfirst($key),
                'count' => $counts[$key] ?? 0,
            ];
        }

        return $result;
    }

    public function findPublishedBySlug(string $slug): NewsArticle
    {
        return NewsArticle::query()
            ->with(['tags'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->firstOrFail();
    }

    /**
     * @return Collection<int, NewsArticle>
     */
    public function getRelatedArticles(NewsArticle $article, int $limit = 3): Collection
    {
        return NewsArticle::query()
            ->with('tags')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('id', '!=', $article->id)
            ->where('category', $article->category)
            ->orderByDesc('published_at')
            ->take($limit)
            ->get();
    }
}
