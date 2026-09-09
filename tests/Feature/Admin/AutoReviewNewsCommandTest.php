<?php

use App\Models\AiProvider;
use App\Models\NewsCluster;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

test('it analyzes pending clusters without a verdict and auto-rejects the discarded ones', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    $toPublish = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);
    $toDiscard = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);
    $alreadyAnalyzed = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish']);

    Prism::fake([
        TextResponseFake::make()->withText(
            "ID:{$toPublish->id}:PUBLICAR:buena cobertura\nID:{$toDiscard->id}:DESCARTAR:poco relevante"
        ),
    ]);

    $this->artisan('news:auto-review')
        ->expectsOutputToContain('Clusters analizados: 2')
        ->expectsOutputToContain('Rechazados automáticamente por baja relevancia: 1')
        ->assertExitCode(0);

    expect($toPublish->fresh())
        ->status->toBe('pending')
        ->ai_verdict->toBe('publish');

    expect($toDiscard->fresh())
        ->status->toBe('rejected')
        ->ai_verdict->toBe('discard');

    expect($alreadyAnalyzed->fresh()->status)->toBe('pending');
});

test('it does not touch clusters marked publish, even automatically', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    $published = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish']);

    $this->artisan('news:auto-review')->assertExitCode(0);

    expect($published->fresh())
        ->status->toBe('pending')
        ->ai_verdict->toBe('publish');
});

test('it runs safely with no active ai provider configured', function () {
    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);

    $this->artisan('news:auto-review')
        ->expectsOutputToContain('Clusters analizados: 0')
        ->assertExitCode(0);
});

test('it runs safely with nothing pending to analyze', function () {
    $this->artisan('news:auto-review')
        ->expectsOutputToContain('Clusters analizados: 0')
        ->expectsOutputToContain('Rechazados automáticamente por baja relevancia: 0')
        ->assertExitCode(0);
});
