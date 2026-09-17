<?php

use App\Models\AiProvider;
use App\Models\NewsCluster;
use App\Models\ScrapedItem;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

test('it merges pending clusters that the ai says are the same real story', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    $weak = NewsCluster::factory()->create([
        'status' => 'pending',
        'category' => 'anime',
        'title' => 'Fuente A anuncia la temporada 2',
        'relevance_score' => 5,
    ]);
    ScrapedItem::factory()->create(['news_cluster_id' => $weak->id]);
    $strong = NewsCluster::factory()->create([
        'status' => 'pending',
        'category' => 'anime',
        'title' => 'Se confirma la segunda temporada según Fuente B',
        'relevance_score' => 20,
    ]);
    ScrapedItem::factory()->create(['news_cluster_id' => $strong->id]);
    // Categoría distinta, no debería entrar en el mismo lote de fusión.
    $unrelated = NewsCluster::factory()->create([
        'status' => 'pending',
        'category' => 'gaming',
        'title' => 'Un juego nuevo cualquiera',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText("GRUPO:{$weak->id},{$strong->id}"),
    ]);

    $this->artisan('news:auto-merge')
        ->expectsOutputToContain('Fusionados automáticamente por ser la misma noticia: 1')
        ->assertExitCode(0);

    expect($weak->fresh()->status)->toBe('rejected')
        ->and($strong->fresh())
        ->status->toBe('pending')
        ->sources_count->toBe(2)
        ->and($unrelated->fresh()->status)->toBe('pending');
});

test('it does not try to merge duplicates when there is no active ai provider', function () {
    NewsCluster::factory()->count(2)->create(['status' => 'pending', 'category' => 'anime']);

    $this->artisan('news:auto-merge')
        ->expectsOutputToContain('Fusionados automáticamente por ser la misma noticia: 0')
        ->assertExitCode(0);
});

test('it runs safely with nothing pending to merge', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    $this->artisan('news:auto-merge')
        ->expectsOutputToContain('Fusionados automáticamente por ser la misma noticia: 0')
        ->assertExitCode(0);
});
