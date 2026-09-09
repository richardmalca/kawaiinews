<?php

use App\Models\NewsCluster;
use App\Services\Admin\NewsArticleService;

test('a cluster with a youtube video_url gets the trailer embedded in the article body', function () {
    $cluster = NewsCluster::factory()->create([
        'video_url' => 'https://youtu.be/dQw4w9WgXcQ',
    ]);

    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    expect($article->body)
        ->toContain('https://www.youtube.com/embed/dQw4w9WgXcQ')
        ->toContain('<iframe');
});

test('a cluster without a video_url does not add any embed', function () {
    $cluster = NewsCluster::factory()->create(['video_url' => null]);

    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    expect($article->body ?? '')->not->toContain('<iframe');
});
