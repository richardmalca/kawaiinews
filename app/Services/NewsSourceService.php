<?php

namespace App\Services;

use App\Models\NewsSource;

class NewsSourceService
{
    public function save(NewsSource $newsSource, array $data): NewsSource
    {
        $newsSource->fill([
            'label' => $data['label'],
            'url' => $data['url'],
            'rss_url' => $data['rss_url'] ?? null,
        ]);

        $newsSource->save();

        return $newsSource;
    }

    public function toggle(NewsSource $newsSource): NewsSource
    {
        $newsSource->update(['is_active' => ! $newsSource->is_active]);

        return $newsSource;
    }

    public function delete(NewsSource $newsSource): void
    {
        $newsSource->delete();
    }

    public function activateAll(): void
    {
        NewsSource::query()->update(['is_active' => true]);
    }

    public function deactivateAll(): void
    {
        NewsSource::query()->update(['is_active' => false]);
    }

    public function activateCategory(string $category): void
    {
        NewsSource::where('category', $category)->update(['is_active' => true]);
    }

    public function deactivateCategory(string $category): void
    {
        NewsSource::where('category', $category)->update(['is_active' => false]);
    }

    public function groupedByCategory(): array
    {
        $categories = config('news_sources_catalog');
        $sources = NewsSource::orderBy('label')->get()->groupBy('category');

        return collect($categories)
            ->map(fn (array $categoryEntry, string $categoryKey) => [
                'category' => $categoryKey,
                'label' => $categoryEntry['label'],
                'sources' => $sources->get($categoryKey, collect())->values(),
            ])
            ->values()
            ->all();
    }

    public function summary(): array
    {
        $sources = NewsSource::all();

        return [
            'total_active' => $sources->where('is_active', true)->count(),
            'total_sources' => $sources->count(),
            'categories_active' => $sources->where('is_active', true)
                ->pluck('category')
                ->unique()
                ->count(),
        ];
    }
}
