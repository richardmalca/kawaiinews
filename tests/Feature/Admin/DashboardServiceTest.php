<?php

use App\Models\AiProvider;
use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\NewsSource;
use App\Models\Share;
use App\Models\User;
use App\Services\Admin\DashboardService;
use Illuminate\Support\Facades\DB;

test('summary counts users, views, reactions and shares for today and the week', function () {
    $today = User::factory()->create(['created_at' => now()]);
    User::factory()->create(['created_at' => now()->subDays(2)]);
    User::factory()->create(['created_at' => now()->subDays(20)]);

    expect($today)->not->toBeNull();

    $article = NewsArticle::factory()->published()->create(['views_count' => 50]);

    DB::table('article_view_daily')->insert([
        ['news_article_id' => $article->id, 'date' => now()->toDateString(), 'views' => 10, 'created_at' => now(), 'updated_at' => now()],
        ['news_article_id' => $article->id, 'date' => now()->subDays(3)->toDateString(), 'views' => 5, 'created_at' => now(), 'updated_at' => now()],
    ]);

    $liker = User::factory()->create(['created_at' => now()->subDays(20)]);
    $liker->like($article);

    $favoriter = User::factory()->create(['created_at' => now()->subDays(20)]);
    $favoriter->favorite($article);

    Share::factory()->create([
        'news_article_id' => $article->id,
        'user_id' => User::factory()->create(['created_at' => now()->subDays(20)]),
    ]);

    $summary = app(DashboardService::class)->summary();

    expect($summary['users']['total'])->toBe(6)
        ->and($summary['users']['new_today'])->toBe(1)
        ->and($summary['users']['new_this_week'])->toBe(2)
        ->and($summary['views']['total'])->toBe(50)
        ->and($summary['views']['today'])->toBe(10)
        ->and($summary['views']['this_week'])->toBe(15)
        ->and($summary['reactions_today'])->toBe(2)
        ->and($summary['shares_today'])->toBe(1)
        ->and($summary['articles']['published'])->toBe(1);
});

test('timeline groups views, reactions and shares by day', function () {
    $article = NewsArticle::factory()->published()->create();

    DB::table('article_view_daily')->insert([
        'news_article_id' => $article->id,
        'date' => now()->toDateString(),
        'views' => 7,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $user = User::factory()->create();
    $user->like($article);

    Share::factory()->create(['news_article_id' => $article->id]);

    $timeline = app(DashboardService::class)->timeline(3);

    expect($timeline)->toHaveCount(3);

    $today = collect($timeline)->last();

    expect($today['views'])->toBe(7)
        ->and($today['reactions'])->toBe(1)
        ->and($today['shares'])->toBe(1);
});

test('top articles are sorted by views and include their reaction counts', function () {
    $popular = NewsArticle::factory()->published()->create(['views_count' => 100]);
    $unpopular = NewsArticle::factory()->published()->create(['views_count' => 1]);
    NewsArticle::factory()->create(['status' => 'draft', 'views_count' => 999]);

    $user = User::factory()->create();
    $user->like($popular);
    $user->favorite($popular);
    Share::factory()->create(['news_article_id' => $popular->id]);

    $top = app(DashboardService::class)->topArticles();

    expect($top[0]['id'])->toBe($popular->id)
        ->and($top[0]['likes'])->toBe(1)
        ->and($top[0]['favorites'])->toBe(1)
        ->and($top[0]['shares'])->toBe(1)
        ->and($top[1]['id'])->toBe($unpopular->id);

    expect(collect($top))->toHaveCount(2);
});

test('category breakdown covers every category in the catalog even with zero articles', function () {
    NewsArticle::factory()->published()->create(['category' => 'anime', 'views_count' => 20]);

    $breakdown = app(DashboardService::class)->categoryBreakdown();
    $categoryKeys = collect($breakdown)->pluck('category');

    expect($categoryKeys)->toContain('anime')
        ->and($categoryKeys->count())->toBe(count(config('news_sources_catalog')));

    $anime = collect($breakdown)->firstWhere('category', 'anime');
    expect($anime['articles'])->toBe(1)
        ->and($anime['views'])->toBe(20);
});

test('growth compares this week against the previous week', function () {
    $article = NewsArticle::factory()->published()->create();

    DB::table('article_view_daily')->insert([
        ['news_article_id' => $article->id, 'date' => now()->toDateString(), 'views' => 20, 'created_at' => now(), 'updated_at' => now()],
        ['news_article_id' => $article->id, 'date' => now()->subDays(10)->toDateString(), 'views' => 10, 'created_at' => now(), 'updated_at' => now()],
    ]);

    $growth = app(DashboardService::class)->growth();

    expect($growth['views']['current'])->toBe(20)
        ->and($growth['views']['previous'])->toBe(10)
        ->and($growth['views']['change_percent'])->toBe(100.0);
});

test('growth handles a previous period with zero activity without dividing by zero', function () {
    $growth = app(DashboardService::class)->growth();

    expect($growth['views']['current'])->toBe(0)
        ->and($growth['views']['previous'])->toBe(0)
        ->and($growth['views']['change_percent'])->toBeNull();
});

test('health checks report ok when everything is configured and moving', function () {
    AiProvider::factory()->create(['is_active' => true, 'api_key' => 'key']);
    NewsSource::factory()->create(['is_active' => true, 'rss_url' => 'https://example.test/feed', 'last_scraped_at' => now()]);
    NewsArticle::factory()->published()->create(['featured_image' => 'https://example.test/image.png']);

    $checks = collect(app(DashboardService::class)->healthChecks())->keyBy('label');

    expect($checks['Proveedor de IA']['status'])->toBe('ok')
        ->and($checks['Fuentes de noticias']['status'])->toBe('ok')
        ->and($checks['Bandeja de revisión']['status'])->toBe('ok')
        ->and($checks['Último scraping']['status'])->toBe('ok')
        ->and($checks['Worker de cola']['status'])->toBe('ok')
        ->and($checks['Imágenes destacadas']['status'])->toBe('ok');
});

test('health checks flag missing ai provider, no active sources, and articles without an image', function () {
    NewsArticle::factory()->published()->create(['featured_image' => null]);

    $checks = collect(app(DashboardService::class)->healthChecks())->keyBy('label');

    expect($checks['Proveedor de IA']['status'])->toBe('critical')
        ->and($checks['Fuentes de noticias']['status'])->toBe('critical')
        ->and($checks['Imágenes destacadas']['status'])->toBe('warning');
});

test('health checks flag a stuck queue as critical', function () {
    DB::table('jobs')->insert([
        'queue' => 'default',
        'payload' => 'x',
        'attempts' => 0,
        'reserved_at' => null,
        'available_at' => now()->subMinutes(30)->timestamp,
        'created_at' => now()->subMinutes(30)->timestamp,
    ]);

    $checks = collect(app(DashboardService::class)->healthChecks())->keyBy('label');

    expect($checks['Worker de cola']['status'])->toBe('critical');
});

test('cache driver check reports ok when the configured cache works', function () {
    $checks = collect(app(DashboardService::class)->healthChecks())->keyBy('label');

    expect($checks['Caché']['status'])->toBe('ok');
});

test('dashboard queries still work even if the cache driver is broken', function () {
    config(['cache.default' => 'this-driver-does-not-exist']);

    $summary = app(DashboardService::class)->summary();

    expect($summary['users']['total'])->toBeInt();
});

test('summary, growth, timeline and top articles all include comments', function () {
    $article = NewsArticle::factory()->published()->create();

    Comment::factory()->create(['news_article_id' => $article->id, 'created_at' => now()]);
    Comment::factory()->create(['news_article_id' => $article->id, 'created_at' => now()->subDays(2)]);
    Comment::factory()->create(['news_article_id' => $article->id, 'created_at' => now()->subDays(20)]);

    $summary = app(DashboardService::class)->summary();

    expect($summary['comments']['total'])->toBe(3)
        ->and($summary['comments']['today'])->toBe(1)
        ->and($summary['comments']['this_week'])->toBe(2);

    $growth = app(DashboardService::class)->growth();
    expect($growth['comments']['current'])->toBe(2);

    $timeline = collect(app(DashboardService::class)->timeline())->keyBy('date');
    expect($timeline[now()->toDateString()]['comments'])->toBe(1);

    $topArticles = collect(app(DashboardService::class)->topArticles())->keyBy('id');
    expect($topArticles[$article->id]['comments'])->toBe(3);
});
