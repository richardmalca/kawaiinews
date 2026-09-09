<?php

use App\Models\NewsArticle;
use App\Support\PublicNewsCacheVersion;

test('sitemap lists published articles and excludes drafts', function () {
    $published = NewsArticle::factory()->create([
        'slug' => 'noticia-publicada',
        'status' => 'published',
        'published_at' => now(),
    ]);
    NewsArticle::factory()->create([
        'slug' => 'noticia-borrador',
        'status' => 'draft',
        'published_at' => null,
    ]);

    $response = $this->get(route('sitemap'));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('application/xml');
    $response->assertSeeText('noticias/'.$published->slug, false);
    $response->assertDontSeeText('noticia-borrador', false);
});

test('rss feed lists published articles and excludes drafts', function () {
    $published = NewsArticle::factory()->create([
        'title' => 'Noticia Publicada RSS',
        'status' => 'published',
        'published_at' => now(),
    ]);
    NewsArticle::factory()->create([
        'title' => 'Noticia Borrador RSS',
        'status' => 'draft',
        'published_at' => null,
    ]);

    $response = $this->get(route('feed'));

    $response->assertOk();
    $response->assertSeeText($published->title, false);
    $response->assertDontSeeText('Noticia Borrador RSS', false);
});

test('the sitemap is cached until the public news cache version bumps', function () {
    NewsArticle::factory()->create([
        'slug' => 'primera-noticia',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->get(route('sitemap'))->assertSeeText('primera-noticia', false);

    NewsArticle::factory()->create([
        'slug' => 'segunda-noticia-sin-bump',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->get(route('sitemap'))->assertDontSeeText('segunda-noticia-sin-bump', false);

    PublicNewsCacheVersion::bump();

    $this->get(route('sitemap'))->assertSeeText('segunda-noticia-sin-bump', false);
});
