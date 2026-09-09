<?php

use App\Models\NewsArticle;
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
