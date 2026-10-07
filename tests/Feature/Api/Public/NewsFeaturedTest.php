<?php

use App\Models\NewsArticle;

test('api news only features articles that have a featured image', function () {
    NewsArticle::factory()->create([
        'title' => 'Sin Imagen Destacada',
        'status' => 'published',
        'published_at' => now(),
        'featured_image' => null,
    ]);

    $withImage = NewsArticle::factory()->create([
        'title' => 'Con Imagen Destacada',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'featured_image' => 'https://cdn.kawaiinews.net/media/test.webp',
    ]);

    $response = $this->getJson('/api/news');

    $response->assertOk();
    $titles = collect($response->json('featured.data'))->pluck('title');

    expect($titles)->toContain('Con Imagen Destacada')
        ->and($titles)->not->toContain('Sin Imagen Destacada')
        ->and($response->json('featured.data.0.id'))->toBe($withImage->id);
});
