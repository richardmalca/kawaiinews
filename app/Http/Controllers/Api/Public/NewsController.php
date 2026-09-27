<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Models\Tag;
use App\Services\Public\NewsService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class NewsController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService
    ) {}

    /**
     * Home del frontend Next.js: destacadas + últimas noticias.
     * Mismo shape que consume `getLatestNews()` en kawaiinews-nextjs.
     */
    public function index(Request $request): JsonResponse
    {
        $featured = $this->newsService->getFeatured(limit: 4);
        $articles = $this->newsService->getPaginatedArticles(
            category: $request->query('categoria'),
            search: $request->query('q'),
            perPage: 12,
        );

        return response()->json([
            'featured' => [
                'data' => NewsArticleResource::collection($featured),
            ],
            'articles' => [
                'data' => NewsArticleResource::collection($articles->items()),
            ],
        ]);
    }

    /**
     * Búsqueda de etiquetas para el buscador del frontend — antes el
     * buscador solo miraba las tags de los ~12 artículos ya cargados en
     * memoria de la home, así que cualquier tag fuera de esa muestra
     * chica no aparecía nunca por más que existiera. Esto sí recorre
     * todas las tags reales.
     */
    public function searchTags(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['tags' => []]);
        }

        $tags = Tag::query()
            ->where('name', 'like', "%{$q}%")
            ->withCount(['articles' => fn ($query) => $query->where('status', 'published')->whereNotNull('published_at')])
            ->having('articles_count', '>', 0)
            ->orderByDesc('articles_count')
            ->limit(8)
            ->get();

        return response()->json([
            'tags' => $tags->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'articles_count' => $tag->articles_count,
            ])->values(),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        try {
            $article = $this->newsService->findPublishedBySlug($slug);
        } catch (ModelNotFoundException) {
            throw new NotFoundHttpException('Artículo no encontrado.');
        }

        return response()->json([
            'article' => new NewsArticleResource($article),
        ]);
    }
}
