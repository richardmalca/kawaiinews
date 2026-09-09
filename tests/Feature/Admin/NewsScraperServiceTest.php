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

test('a youtube trailer link in the description is captured and propagated to the cluster', function () {
    NewsSource::factory()->create([
        'rss_url' => 'https://trailer-feed.test/feed',
        'category' => 'anime',
    ]);

    Http::fake([
        'trailer-feed.test/*' => Http::response(<<<'XML'
            <?xml version="1.0"?>
            <rss version="2.0">
                <channel>
                    <item>
                        <title>Anime revela su trailer oficial</title>
                        <link>https://trailer-feed.test/noticia-1</link>
                        <description>Mira el trailer acá: &lt;a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"&gt;link&lt;/a&gt;</description>
                        <pubDate>Mon, 08 Sep 2026 10:00:00 +0000</pubDate>
                    </item>
                </channel>
            </rss>
            XML, 200),
    ]);

    app(NewsScraperService::class)->run();

    $scrapedItem = ScrapedItem::where('url', 'https://trailer-feed.test/noticia-1')->firstOrFail();

    expect($scrapedItem->video_url)->toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        ->and($scrapedItem->newsCluster->video_url)->toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('a youtube trailer link on the article page is captured when not present in rss feed', function () {
    NewsSource::factory()->create([
        'rss_url' => 'https://article-page-feed.test/feed',
        'category' => 'gaming',
    ]);

    Http::fake([
        'https://article-page-feed.test/feed' => Http::response(<<<'XML'
            <?xml version="1.0"?>
            <rss version="2.0">
                <channel>
                    <item>
                        <title>Juego revela gameplay trailer</title>
                        <link>https://article-page-feed.test/noticia-zelda</link>
                        <description>Noticia sin enlace de video en el rss</description>
                        <pubDate>Mon, 08 Sep 2026 10:00:00 +0000</pubDate>
                    </item>
                </channel>
            </rss>
            XML, 200),
        'https://article-page-feed.test/noticia-zelda' => Http::response(<<<'HTML'
            <!DOCTYPE html>
            <html>
                <body>
                    <h1>Zelda Ocarina of Time Remake</h1>
                    <iframe src="https://www.youtube.com/embed/wuFfiTEr2yc" width="560" height="315"></iframe>
                </body>
            </html>
            HTML, 200),
    ]);

    app(NewsScraperService::class)->run();

    $scrapedItem = ScrapedItem::where('url', 'https://article-page-feed.test/noticia-zelda')->firstOrFail();

    expect($scrapedItem->video_url)->toBe('https://www.youtube.com/watch?v=wuFfiTEr2yc')
        ->and($scrapedItem->newsCluster->video_url)->toBe('https://www.youtube.com/watch?v=wuFfiTEr2yc');
});
