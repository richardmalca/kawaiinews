<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNewsArticleRequest;
use App\Http\Requests\Admin\UpdateNewsArticleRequest;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Models\NewsArticle;
use App\Models\Tag;
use App\Services\Admin\NewsArticleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsArticleController extends Controller
{
    public function __construct(private readonly NewsArticleService $newsArticleService) {}

    public function index(Request $request): Response
    {
        $category = $request->string('category')->value() ?: null;

        $articles = NewsArticle::with('tags')
            ->when($category, fn ($query) => $query->where('category', $category))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/news-articles/index', [
            'articles' => NewsArticleResource::collection($articles)->resolve(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'total' => $articles->total(),
            ],
            'category' => $category,
            'categories' => array_keys(config('news_sources_catalog')),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/news-articles/create', [
            'categories' => config('news_sources_catalog'),
            'availableTags' => Tag::orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreNewsArticleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $newsArticle = $this->newsArticleService->createManual($data, $tags, $request->user()->id);

        return to_route('admin.news-articles.edit', $newsArticle);
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

    public function toggleStatus(NewsArticle $newsArticle): RedirectResponse
    {
        $this->newsArticleService->toggleStatus($newsArticle);

        return back();
    }

    public function destroy(NewsArticle $newsArticle): RedirectResponse
    {
        $this->newsArticleService->delete($newsArticle);

        return to_route('admin.news-articles.index');
    }
}
