<?php

use App\Models\Media;
use App\Models\NewsArticle;

test('it rewrites media urls pointing to the old domain and syncs the article copies', function () {
    $article = NewsArticle::factory()->create([
        'featured_image' => 'https://pub-old.r2.dev/site/img/foo.webp',
    ]);

    $image = Media::factory()->create([
        'url' => 'https://pub-old.r2.dev/site/img/foo.webp',
        'type' => 'image',
        'news_article_id' => $article->id,
    ]);

    $untouched = Media::factory()->create([
        'url' => 'https://otherdomain.test/img/bar.webp',
        'type' => 'image',
    ]);

    $this->artisan('media:rewrite-domain', ['old' => 'https://pub-old.r2.dev', 'new' => 'https://img.kawaiinews.net'])
        ->assertExitCode(0);

    expect($image->fresh()->url)->toBe('https://img.kawaiinews.net/site/img/foo.webp')
        ->and($article->fresh()->featured_image)->toBe('https://img.kawaiinews.net/site/img/foo.webp')
        ->and($untouched->fresh()->url)->toBe('https://otherdomain.test/img/bar.webp');
});

test('dry-run does not change anything', function () {
    $image = Media::factory()->create(['url' => 'https://pub-old.r2.dev/site/img/foo.webp', 'type' => 'image']);

    $this->artisan('media:rewrite-domain', [
        'old' => 'https://pub-old.r2.dev',
        'new' => 'https://img.kawaiinews.net',
        '--dry-run' => true,
    ])->assertExitCode(0);

    expect($image->fresh()->url)->toBe('https://pub-old.r2.dev/site/img/foo.webp');
});

test('it does nothing when old and new domain are the same', function () {
    $this->artisan('media:rewrite-domain', ['old' => 'https://img.kawaiinews.net', 'new' => 'https://img.kawaiinews.net'])
        ->assertExitCode(1);
});
