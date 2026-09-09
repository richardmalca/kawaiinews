<?php

use App\Models\AiProvider;
use App\Models\NewsCluster;
use App\Models\Tag;
use App\Services\Admin\NewsArticleService;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

test('the ai-suggested category and tags are applied to the created article', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular de prueba
            RESUMEN: Un resumen de prueba.
            CUERPO: <p>Cuerpo de prueba.</p>
            CATEGORIA: gaming
            TAGS: Nintendo, Switch 2, remake, Ocarina of Time
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['category' => 'anime']);

    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    expect($article->category)->toBe('gaming')
        ->and($article->tags->pluck('name')->all())->toBe(['Nintendo', 'Switch 2', 'remake', 'Ocarina of Time']);

    expect(Tag::where('name', 'Switch 2')->exists())->toBeTrue();
});

test('an invalid ai category falls back to the cluster category, not a made-up one', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular
            RESUMEN: Un resumen.
            CUERPO: <p>Cuerpo.</p>
            CATEGORIA: deportes
            TAGS:
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['category' => 'gaming']);

    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    expect($article->category)->toBe('gaming')
        ->and($article->tags)->toBeEmpty();
});
