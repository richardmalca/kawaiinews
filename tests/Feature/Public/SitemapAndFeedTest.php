<?php

use App\Models\NewsArticle;

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
