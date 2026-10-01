<?php

use App\Models\NewsArticle;

test('news-sitemap returns every published article, not just a page', function () {
    NewsArticle::factory()->count(15)->create([
        'status' => 'published',
        'published_at' => now(),
    ]);

    NewsArticle::factory()->create([
        'title' => 'Borrador Oculto',
        'status' => 'draft',
        'published_at' => null,
    ]);

    $response = $this->getJson('/api/news-sitemap');

    $response->assertOk();
    $response->assertJsonCount(15, 'articles');
    $response->assertJsonStructure(['articles' => [['slug', 'published_at']]]);
});
