<?php

use App\Models\Media;
use App\Models\NewsArticle;

test('it updates featured_image to the current url of the article latest image media', function () {
    $article = NewsArticle::factory()->create([
        'featured_image' => 'https://old-domain.test/media/vieja.webp',
    ]);
    Media::factory()->create([
        'type' => 'image',
        'news_article_id' => $article->id,
        'url' => 'https://pub-xxxx.r2.dev/media/img-nueva.webp',
    ]);

    $this->artisan('app:sync-article-featured-media-urls')->assertSuccessful();

    expect($article->fresh()->featured_image)->toBe('https://pub-xxxx.r2.dev/media/img-nueva.webp');
});

test('it updates audio_url to the current url of the article latest audio media', function () {
    $article = NewsArticle::factory()->create([
        'audio_url' => 'https://old-domain.test/audio/vieja.mp3',
    ]);
    Media::factory()->create([
        'type' => 'audio',
        'news_article_id' => $article->id,
        'url' => 'https://pub-xxxx.r2.dev/audio/audio-nueva.mp3',
    ]);

    $this->artisan('app:sync-article-featured-media-urls')->assertSuccessful();

    expect($article->fresh()->audio_url)->toBe('https://pub-xxxx.r2.dev/audio/audio-nueva.mp3');
});

test('when an article has more than one image media, it uses the most recent one', function () {
    $article = NewsArticle::factory()->create(['featured_image' => 'https://old-domain.test/media/vieja.webp']);
    Media::factory()->create(['type' => 'image', 'news_article_id' => $article->id, 'url' => 'https://pub-xxxx.r2.dev/media/primera.webp']);
    Media::factory()->create(['type' => 'image', 'news_article_id' => $article->id, 'url' => 'https://pub-xxxx.r2.dev/media/ultima.webp']);

    $this->artisan('app:sync-article-featured-media-urls')->assertSuccessful();

    expect($article->fresh()->featured_image)->toBe('https://pub-xxxx.r2.dev/media/ultima.webp');
});

test('it does not touch articles that are already up to date', function () {
    $article = NewsArticle::factory()->create(['featured_image' => 'https://pub-xxxx.r2.dev/media/al-dia.webp']);
    Media::factory()->create(['type' => 'image', 'news_article_id' => $article->id, 'url' => 'https://pub-xxxx.r2.dev/media/al-dia.webp']);

    $this->artisan('app:sync-article-featured-media-urls')
        ->expectsOutputToContain('Todos los artículos ya tenían la url al día.')
        ->assertSuccessful();
});

test('--dry-run reports what would change without saving anything', function () {
    $article = NewsArticle::factory()->create(['featured_image' => 'https://old-domain.test/media/vieja.webp']);
    Media::factory()->create(['type' => 'image', 'news_article_id' => $article->id, 'url' => 'https://pub-xxxx.r2.dev/media/nueva.webp']);

    $this->artisan('app:sync-article-featured-media-urls --dry-run')
        ->expectsOutputToContain((string) $article->id)
        ->assertSuccessful();

    expect($article->fresh()->featured_image)->toBe('https://old-domain.test/media/vieja.webp');
});
