<?php

use App\Models\NewsSource;
use App\Models\ScrapedItem;
use App\Services\Admin\NewsScraperService;
use Illuminate\Support\Facades\Http;

test('malformed xml from a feed is reported as an error without crashing the run', function () {
    $source = NewsSource::factory()->create([
        'rss_url' => 'https://broken-feed.test/feed',
    ]);

    Http::fake([
        'broken-feed.test/*' => Http::response('<rss><channel><item><title>Roto & sin escapar</title></channel></rss>', 200),
    ]);

    $result = app(NewsScraperService::class)->run();

    expect($result['sources_scraped'])->toBe(1)
        ->and($result['items_new'])->toBe(0)
        ->and($result['errors'])->toHaveCount(1)
        ->and($result['errors'][0])->toContain($source->label);
});

test('a valid feed is scraped into a new cluster', function () {
    NewsSource::factory()->create([
        'rss_url' => 'https://good-feed.test/feed',
        'category' => 'anime',
    ]);

    Http::fake([
        'good-feed.test/*' => Http::response(<<<'XML'
            <?xml version="1.0"?>
            <rss version="2.0">
                <channel>
                    <item>
                        <title>Una noticia de anime</title>
                        <link>https://good-feed.test/noticia-1</link>
                        <description>Resumen de la noticia</description>
                        <pubDate>Mon, 08 Sep 2026 10:00:00 +0000</pubDate>
                    </item>
                </channel>
            </rss>
            XML, 200),
    ]);

    $result = app(NewsScraperService::class)->run();

    expect($result['items_new'])->toBe(1)
        ->and($result['errors'])->toBeEmpty();

    expect(ScrapedItem::where('url', 'https://good-feed.test/noticia-1')->exists())->toBeTrue();
});
