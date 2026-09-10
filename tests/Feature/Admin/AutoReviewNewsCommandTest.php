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

test('it saves whether a cluster is a rumor and how credible it looks', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    $rumor = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);
    $confirmed = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);

    Prism::fake([
        TextResponseFake::make()->withText(
            "ID:{$rumor->id}:PUBLICAR:buena cobertura:SI:MEDIA\nID:{$confirmed->id}:PUBLICAR:anuncio oficial:NO:NA"
        ),
    ]);

    $this->artisan('news:auto-review')->assertExitCode(0);

    expect($rumor->fresh())
        ->ai_is_rumor->toBeTrue()
        ->ai_credibility->toBe('media');

    expect($confirmed->fresh())
        ->ai_is_rumor->toBeFalse()
        ->ai_credibility->toBeNull();
});

test('it still parses the response if the ai replies without the rumor fields (backwards compatible)', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    $cluster = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);

    Prism::fake([
        TextResponseFake::make()->withText("ID:{$cluster->id}:PUBLICAR:buena cobertura"),
    ]);

    $this->artisan('news:auto-review')->assertExitCode(0);

    expect($cluster->fresh())
        ->ai_verdict->toBe('publish')
        ->ai_is_rumor->toBeNull()
        ->ai_credibility->toBeNull();
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
