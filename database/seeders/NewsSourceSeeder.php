<?php

namespace Database\Seeders;

use App\Models\NewsSource;
use Illuminate\Database\Seeder;

class NewsSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (config('news_sources_catalog') as $categoryKey => $categoryEntry) {
            foreach ($categoryEntry['sources'] as $sourceKey => $source) {
                NewsSource::firstOrCreate(
                    ['source_key' => $sourceKey],
                    [
                        'category' => $categoryKey,
                        'label' => $source['label'],
                        'url' => $source['url'],
                        'rss_url' => $source['rss_url'],
                        'is_active' => false,
                    ]
                );
            }
        }
    }
}
