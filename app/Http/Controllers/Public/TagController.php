<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Models\Tag;
use App\Services\Public\NewsService;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService
    ) {}

    public function __invoke(Tag $tag): Response
    {
        $articles = $this->newsService->getPaginatedArticlesByTag($tag, perPage: 12);
        $categories = $this->newsService->getCategoriesSummary();

        return Inertia::render('public/tag/show', [
            'tag' => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'articles_count' => $tag->articles()->where('status', 'published')->whereNotNull('published_at')->count(),
            ],
            'articles' => NewsArticleResource::collection($articles),
            'categories' => $categories,
        ]);
    }
}
