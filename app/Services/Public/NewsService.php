<?php

namespace App\Services\Public;

use App\Models\NewsArticle;
use App\Support\PublicNewsCacheVersion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator as ConcreteLengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Cache;

class NewsService
{
    private const CACHE_TTL_MINUTES = 5;

    /**
     * @return Collection<int, NewsArticle>
     */
    public function getFeatured(int $limit = 5): Collection
    {
        $ids = $this->remember("featured-ids:{$limit}", fn () => NewsArticle::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->take($limit)
            ->pluck('id')
            ->all());

        return $this->hydrateOrdered($ids);
    }

    public function getPaginatedArticles(?string $category = null, ?string $search = null, int $perPage = 12): LengthAwarePaginator
    {
        $page = Paginator::resolveCurrentPage();

        // Los listados con búsqueda libre no se cachean: la combinatoria de
        // términos posibles haría que la caché casi nunca tenga un hit.
        if ($search) {
            return $this->paginatedArticlesQuery($category, $search, $perPage, $page);
        }

        /** @var array{ids: array<int, int>, total: int} $pageData */
        $pageData = $this->remember(
            "articles-ids:{$category}:{$perPage}:{$page}",
            function () use ($category, $perPage, $page) {
                $query = NewsArticle::query()
                    ->where('status', 'published')
                    ->whereNotNull('published_at')
                    ->when($category, fn ($q, $cat) => $q->where('category', $cat));

                return [
                    'ids' => (clone $query)->orderByDesc('published_at')->forPage($page, $perPage)->pluck('id')->all(),
                    'total' => $query->count(),
                ];
            }
        );

        return (new ConcreteLengthAwarePaginator(
            $this->hydrateOrdered($pageData['ids']),
            $pageData['total'],
            $perPage,
            $page,
            ['path' => Paginator::resolveCurrentPath()],
        ))->withQueryString();
    }

    /**
     * @return Collection<int, NewsArticle>
     */
    public function getTrendingTopics(int $limit = 6): Collection
    {
        $ids = $this->remember("trending-ids:{$limit}", fn () => NewsArticle::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '>=', now()->subDays(14))
            ->orderByDesc('views_count')
            ->orderByDesc('published_at')
            ->take($limit)
            ->pluck('id')
            ->all());

        return $this->hydrateOrdered($ids);
    }

    /**
     * @return array<string, array{label: string, count: int}>
     */
    public function getCategoriesSummary(): array
    {
        return $this->remember('categories-summary', function () {
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
        });
    }

    public function findPublishedBySlug(string $slug): NewsArticle
    {
        // Sin caché: cada vista de detalle necesita el views_count real,
        // y es una consulta por PK/slug indexado, ya es barata.
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
        $ids = $this->remember("related-ids:{$article->id}:{$limit}", fn () => NewsArticle::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('id', '!=', $article->id)
            ->where('category', $article->category)
            ->orderByDesc('published_at')
            ->take($limit)
            ->pluck('id')
            ->all());

        return $this->hydrateOrdered($ids);
    }

    private function paginatedArticlesQuery(?string $category, ?string $search, int $perPage, int $page): LengthAwarePaginator
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
            ->paginate($perPage, page: $page)
            ->withQueryString();
    }

    /**
     * Rehidrata modelos completos (con `tags` cargado) a partir de una
     * lista de IDs ya ordenada, preservando ese orden. Los IDs sí se
     * pueden cachear (son enteros, sin problema); los modelos de Eloquent
     * no (ver `remember()`).
     *
     * @param  array<int, int>  $ids
     * @return Collection<int, NewsArticle>
     */
    private function hydrateOrdered(array $ids): Collection
    {
        if (empty($ids)) {
            return new Collection;
        }

        $models = NewsArticle::query()->with('tags')->whereIn('id', $ids)->get()->keyBy('id');

        return new Collection(
            collect($ids)->map(fn (int $id) => $models->get($id))->filter()->values()->all()
        );
    }

    /**
     * Solo valores serializables (arrays de escalares: IDs, conteos) pasan
     * por acá. `config('cache.serializable_classes')` está en `false` en
     * este proyecto (protección de Laravel contra ataques de deserialización
     * de objetos) — cachear una Collection de Eloquent directamente hace que
     * la lectura devuelva `__PHP_Incomplete_Class` en vez del objeto real,
     * porque Laravel se niega a reconstruir clases PHP desde la caché.
     */
    private function remember(string $key, \Closure $callback): mixed
    {
        $versioned = 'public-news:v'.PublicNewsCacheVersion::current().':'.$key;

        return Cache::remember($versioned, now()->addMinutes(self::CACHE_TTL_MINUTES), $callback);
    }
}
