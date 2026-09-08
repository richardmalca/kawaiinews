<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateNewsArticleRequest;
use App\Http\Resources\NewsArticleResource;
use App\Models\NewsArticle;
use App\Models\Tag;
use App\Services\NewsArticleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NewsArticleController extends Controller
{
    public function __construct(private readonly NewsArticleService $newsArticleService) {}

    public function index(): Response
    {
        return Inertia::render('admin/news-articles/index', [
            'articles' => NewsArticleResource::collection(
                NewsArticle::with('tags')->latest()->get()
            )->resolve(),
        ]);
    }

    public function edit(NewsArticle $newsArticle): Response
    {
        return Inertia::render('admin/news-articles/edit', [
            'article' => (new NewsArticleResource($newsArticle->load('tags')))->resolve(),
            'categories' => config('news_sources_catalog'),
            'availableTags' => Tag::orderBy('name')->pluck('name'),
        ]);
    }

    public function update(UpdateNewsArticleRequest $request, NewsArticle $newsArticle): RedirectResponse
    {
        $data = $request->validated();
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $this->newsArticleService->save($newsArticle, $data, $tags);

        return to_route('admin.news-articles.edit', $newsArticle);
    }

    public function destroy(NewsArticle $newsArticle): RedirectResponse
    {
        $this->newsArticleService->delete($newsArticle);

        return to_route('admin.news-articles.index');
    }
}
