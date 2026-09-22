<?php

use App\Models\NewsArticle;
use App\Models\User;

test('an anonymous visitor loading an article page gets a cacheable Cache-Control header', function () {
    $article = NewsArticle::factory()->create(['status' => 'published', 'published_at' => now()]);

    $response = $this->get(route('news.show', $article->slug));

    $response->assertOk();
    $cacheControl = $response->headers->get('Cache-Control');
    expect($cacheControl)->toContain('public')
        ->and($cacheControl)->toContain('s-maxage=1800')
        ->and($cacheControl)->toContain('stale-while-revalidate=3600');
});

test('a cacheable response only varies on Accept-Encoding, since Cloudflare refuses to cache any other Vary value', function () {
    $article = NewsArticle::factory()->create(['status' => 'published', 'published_at' => now()]);

    $response = $this->get(route('news.show', $article->slug));

    $response->assertOk();
    expect($response->headers->get('Vary'))->toBe('Accept-Encoding');
});

test('an Inertia SPA navigation (X-Inertia header) is never marked cacheable, to avoid mixing it with the full HTML variant', function () {
    $article = NewsArticle::factory()->create(['status' => 'published', 'published_at' => now()]);

    $response = $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => '1'])
        ->get(route('news.show', $article->slug));

    $response->assertHeader('Cache-Control');
    expect($response->headers->get('Cache-Control'))->not->toContain('s-maxage');
});

test('a logged-in visitor never gets the cacheable header, since the page could show personalized state', function () {
    $article = NewsArticle::factory()->create(['status' => 'published', 'published_at' => now()]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('news.show', $article->slug));

    $response->assertHeader('Cache-Control');
    expect($response->headers->get('Cache-Control'))->not->toContain('s-maxage');
});

test('a 404 article page is not marked cacheable', function () {
    $response = $this->get('/noticias/esto-no-existe');

    $response->assertNotFound();
    expect($response->headers->get('Cache-Control'))->not->toContain('s-maxage');
});
