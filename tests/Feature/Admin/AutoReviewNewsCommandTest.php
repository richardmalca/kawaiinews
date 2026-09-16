<?php

use App\Models\AiProvider;
use App\Models\NewsCluster;
use App\Models\ScrapedItem;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

test('it analyzes pending clusters without a verdict and auto-rejects the discarded ones', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    // Categorías distintas para que autoMergeDuplicates() (que corre antes
    // del análisis) no las agrupe en el mismo lote y consuma sin querer la
    // respuesta fake que preparamos para analyzeWithAi() más abajo.
    $toPublish = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null, 'category' => 'anime']);
    $toDiscard = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null, 'category' => 'gaming']);
    $alreadyAnalyzed = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish', 'category' => 'geek']);

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

    $rumor = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null, 'category' => 'anime']);
    $confirmed = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null, 'category' => 'gaming']);

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
        ->expectsOutputToContain('Fusionados automáticamente por ser la misma noticia: 0')
        ->expectsOutputToContain('Clusters analizados: 0')
        ->expectsOutputToContain('Rechazados automáticamente por baja relevancia: 0')
        ->expectsOutputToContain('Rechazados automáticamente por antigüedad: 0')
        ->assertExitCode(0);
});

test('it merges pending clusters that the ai says are the same real story before analyzing them', function () {
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
        TextResponseFake::make()->withText(
            "ID:{$strong->id}:PUBLICAR:buena cobertura\nID:{$unrelated->id}:PUBLICAR:buena cobertura"
        ),
    ]);

    $this->artisan('news:auto-review')
        ->expectsOutputToContain('Fusionados automáticamente por ser la misma noticia: 1')
        ->assertExitCode(0);

    expect($weak->fresh()->status)->toBe('rejected')
        ->and($strong->fresh())
        ->status->toBe('pending')
        ->sources_count->toBe(2)
        ->ai_verdict->toBe('publish');
});

test('it does not try to merge duplicates when there is no active ai provider', function () {
    NewsCluster::factory()->count(2)->create(['status' => 'pending', 'category' => 'anime']);

    $this->artisan('news:auto-review')
        ->expectsOutputToContain('Fusionados automáticamente por ser la misma noticia: 0')
        ->assertExitCode(0);
});

test('it also rejects pending clusters older than 5 days, regardless of their ai verdict', function () {
    $stalePublish = NewsCluster::factory()->create([
        'status' => 'pending',
        'ai_verdict' => 'publish',
        'first_seen_at' => now()->subDays(6),
    ]);
    $staleUnanalyzed = NewsCluster::factory()->create([
        'status' => 'pending',
        'ai_verdict' => null,
        'first_seen_at' => now()->subDays(10),
    ]);
    $recent = NewsCluster::factory()->create([
        'status' => 'pending',
        'ai_verdict' => 'publish',
        'first_seen_at' => now()->subDays(2),
    ]);

    $this->artisan('news:auto-review')
        ->expectsOutputToContain('Rechazados automáticamente por antigüedad: 2')
        ->assertExitCode(0);

    expect($stalePublish->fresh()->status)->toBe('rejected')
        ->and($staleUnanalyzed->fresh()->status)->toBe('rejected')
        ->and($recent->fresh()->status)->toBe('pending');
});
