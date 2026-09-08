<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateNewsSourceRequest;
use App\Http\Resources\NewsSourceResource;
use App\Models\NewsSource;
use App\Services\NewsSourceService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NewsSourceController extends Controller
{
    public function __construct(private readonly NewsSourceService $newsSourceService) {}

    public function index(): Response
    {
        $groups = collect($this->newsSourceService->groupedByCategory())
            ->map(fn (array $group) => [
                'category' => $group['category'],
                'label' => $group['label'],
                'sources' => NewsSourceResource::collection($group['sources'])->resolve(),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/news-sources/index', [
            'groups' => $groups,
            'summary' => $this->newsSourceService->summary(),
        ]);
    }

    public function update(UpdateNewsSourceRequest $request, NewsSource $newsSource): RedirectResponse
    {
        $this->newsSourceService->save($newsSource, $request->validated());

        return to_route('admin.news-sources.index');
    }

    public function toggle(NewsSource $newsSource): RedirectResponse
    {
        $this->newsSourceService->toggle($newsSource);

        return to_route('admin.news-sources.index');
    }

    public function activateAll(): RedirectResponse
    {
        $this->newsSourceService->activateAll();

        return to_route('admin.news-sources.index');
    }

    public function deactivateAll(): RedirectResponse
    {
        $this->newsSourceService->deactivateAll();

        return to_route('admin.news-sources.index');
    }

    public function activateCategory(string $category): RedirectResponse
    {
        abort_unless(array_key_exists($category, config('news_sources_catalog')), 404);

        $this->newsSourceService->activateCategory($category);

        return to_route('admin.news-sources.index');
    }

    public function deactivateCategory(string $category): RedirectResponse
    {
        abort_unless(array_key_exists($category, config('news_sources_catalog')), 404);

        $this->newsSourceService->deactivateCategory($category);

        return to_route('admin.news-sources.index');
    }

    public function destroy(NewsSource $newsSource): RedirectResponse
    {
        $this->newsSourceService->delete($newsSource);

        return to_route('admin.news-sources.index');
    }
}
