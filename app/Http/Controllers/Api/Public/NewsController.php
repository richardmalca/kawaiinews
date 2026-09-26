<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
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
