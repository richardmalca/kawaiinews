<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNewsArticleRequest;
use App\Http\Requests\Admin\UpdateNewsArticleRequest;
use App\Http\Resources\Shared\NewsArticleResource;
use App\Models\NewsArticle;
use App\Models\Tag;
use App\Services\Admin\NewsArticleService;
use App\Support\ActivityLogger;
use Illuminate\Database\Eloquent\Collection;
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
        $search = $request->string('search')->value() ?: null;

        $articles = NewsArticle::with(['tags', 'newsCluster.scrapedItems.newsSource'])
            ->when($category, fn ($query) => $query->where('category', $category))
            ->when($search, fn ($query) => $query->where('title', 'like', '%'.$search.'%'))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/news-articles/index', [
            'articles' => $this->withListExtras($articles->getCollection()),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'total' => $articles->total(),
            ],
            'category' => $category,
            'search' => $search,
            'categories' => array_keys(config('news_sources_catalog')),
            'kpis' => $this->newsArticleService->adminKpis($category),
        ]);
    }

    /**
     * Arma la fila que ve el admin en la lista de Noticias: lo mismo que
     * expone NewsArticleResource (compartido con el sitio público, no lo
     * tocamos) más lo que solo importa acá — las fuentes originales del
     * cluster de donde salió, y si ya tiene trailer, imagen o audio, para
     * verlo de un vistazo sin entrar a cada una.
     *
     * @param  Collection<int, NewsArticle>  $articles
     * @return array<int, array<string, mixed>>
     */
    private function withListExtras($articles): array
    {
        $resolved = NewsArticleResource::collection($articles)->resolve();

        return $articles->values()->map(function (NewsArticle $article, int $index) use ($resolved) {
            return [
                ...$resolved[$index],
                'has_image' => filled($article->featured_image),
                'has_audio' => filled($article->audio_url),
                'has_video' => filled($article->newsCluster?->video_url),
                'references' => $article->newsCluster?->scrapedItems
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'title' => $item->title,
                        'url' => $item->url,
                        'source_label' => $item->newsSource->label,
                    ])
                    ->values() ?? [],
            ];
        })->all();
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

        ActivityLogger::log('news_article.created', $newsArticle, "Creó \"{$newsArticle->title}\"");

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

        ActivityLogger::log('news_article.updated', $newsArticle, "Editó \"{$newsArticle->title}\"");

        return to_route('admin.news-articles.edit', $newsArticle);
    }

    public function toggleStatus(NewsArticle $newsArticle): RedirectResponse
    {
        $this->newsArticleService->toggleStatus($newsArticle);

        ActivityLogger::log(
            'news_article.status_toggled',
            $newsArticle,
            "Cambió \"{$newsArticle->title}\" a {$newsArticle->status}"
        );

        return back();
    }

    public function destroy(NewsArticle $newsArticle): RedirectResponse
    {
        $title = $newsArticle->title;

        $this->newsArticleService->delete($newsArticle);

        ActivityLogger::log('news_article.deleted', description: "Eliminó \"{$title}\"");

        return to_route('admin.news-articles.index');
    }
}
