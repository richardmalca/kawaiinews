<?php

use App\Models\NewsArticle;
use App\Services\Public\ArticleViewService;
use Illuminate\Http\Request;

beforeEach(function () {
    // El driver `array` (default de testing) auto-inicializa Cache::increment()
    // en una clave inexistente, a diferencia del driver `database` que usa
    // este proyecto en dev/producción. Forzar `database` acá es lo que
    // detectó el bug real (el contador nunca se creaba) que `array` ocultaba.
    config(['cache.default' => 'database']);
});

test('a view is only counted once per viewer within the dedupe window', function () {
    $article = NewsArticle::factory()->create(['views_count' => 0]);
    $service = app(ArticleViewService::class);

    $request = Request::create('/noticias/'.$article->slug, 'GET', server: [
        'REMOTE_ADDR' => '10.0.0.1',
        'HTTP_USER_AGENT' => 'PestBrowser/1.0',
    ]);

    $service->record($article, $request);
    $service->record($article, $request);
    $service->record($article, $request);

    $flushed = $service->flushPending();

    expect($flushed)->toBe(1);

    $article->refresh();
    expect($article->views_count)->toBe(1);
});

test('flushing pending views does not touch updated_at', function () {
    $article = NewsArticle::factory()->create(['views_count' => 0]);
    $originalUpdatedAt = $article->updated_at;
    $service = app(ArticleViewService::class);

    $request = Request::create('/noticias/'.$article->slug, 'GET', server: [
        'REMOTE_ADDR' => '10.0.0.2',
        'HTTP_USER_AGENT' => 'PestBrowser/1.0',
    ]);

    $service->record($article, $request);
    $service->flushPending();

    $article->refresh();

    expect($article->views_count)->toBe(1)
        ->and($article->updated_at->eq($originalUpdatedAt))->toBeTrue();
});

test('different viewers each count as a separate view', function () {
    $article = NewsArticle::factory()->create(['views_count' => 0]);
    $service = app(ArticleViewService::class);

    $service->record($article, Request::create('/', 'GET', server: [
        'REMOTE_ADDR' => '10.0.0.3',
        'HTTP_USER_AGENT' => 'A',
    ]));
    $service->record($article, Request::create('/', 'GET', server: [
        'REMOTE_ADDR' => '10.0.0.4',
        'HTTP_USER_AGENT' => 'B',
    ]));

    $service->flushPending();

    $article->refresh();
    expect($article->views_count)->toBe(2);
});
