<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Models\Tag;
use App\Services\Public\NewsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService
    ) {}

    public function __invoke(Tag $tag, Request $request): Response
    {
        $articles = $this->newsService->getPaginatedArticlesByTag($tag, perPage: 12);
        $categories = $this->newsService->getCategoriesSummary();
        $user = $request->user();

        return Inertia::render('public/tag/show', [
            'tag' => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'articles_count' => $tag->articles()->where('status', 'published')->whereNotNull('published_at')->count(),
                'followers_count' => $tag->followers()->count(),
                'is_following' => $user ? $user->isFollowing($tag) : false,
            ],
            'articles' => NewsArticleResource::collection($articles),
            'categories' => $categories,
        ]);
    }
}
