<?php

use App\Jobs\AcceptNewsClusterJob;
use App\Jobs\GenerateArticleFeaturedImageJob;
use App\Jobs\GenerateArticleNarrationJob;
use App\Jobs\PublishArticleWhenReadyJob;
use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Services\Admin\NewsArticleService;
use App\Support\JobRunStatus;
use Illuminate\Support\Facades\Bus;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

function fakeArticleDraftResponse(): TextResponseFake
{
    return TextResponseFake::make()->withText(<<<'TXT'
        TITULO: Un titular de prueba
        RESUMEN: Un resumen de prueba.
        CUERPO: <p>Cuerpo de prueba.</p>
        CATEGORIA: anime
        TAGS:
        TXT);
}

test('createFromCluster dispatches the image job loose and delays publish, instead of chaining them', function () {
    Bus::fake();

    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create([
        'provider' => 'gemini',
        'is_active_for_images' => true,
        'auto_generate_featured_image' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([fakeArticleDraftResponse()]);

    $cluster = NewsCluster::factory()->create(['category' => 'anime']);

    app(NewsArticleService::class)->createFromCluster($cluster);

    // Sueltos, no encadenados: si el chain existiera, un fallo del job de
    // imagen a nivel del framework se llevaría puesto el de publicar.
    Bus::assertDispatched(GenerateArticleFeaturedImageJob::class);
    Bus::assertDispatched(fn (PublishArticleWhenReadyJob $job) => $job->delay !== null);
});

test('an accepted article ends up published once the chain runs, with no image or audio provider active', function () {
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);

    Prism::fake([fakeArticleDraftResponse()]);

    $cluster = NewsCluster::factory()->create(['category' => 'anime']);

    // Sin Queue::fake() ni Bus::fake(): en tests QUEUE_CONNECTION=sync, así
    // que la cadena corre en el momento, como en el flujo real.
    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    expect($article->fresh())
        ->status->toBe('published')
        ->published_at->not->toBeNull();
});

test('publishIfDraft does nothing if the article is already published', function () {
    $article = NewsArticle::factory()->create(['status' => 'published', 'published_at' => now()->subDay()]);
    $originalPublishedAt = $article->published_at;

    app(NewsArticleService::class)->publishIfDraft($article);

    expect($article->fresh()->published_at->equalTo($originalPublishedAt))->toBeTrue();
});

test('PublishArticleWhenReadyJob publishes the article it is given', function () {
    $article = NewsArticle::factory()->create(['status' => 'draft']);

    (new PublishArticleWhenReadyJob($article->id))->handle(app(NewsArticleService::class));

    expect($article->fresh()->status)->toBe('published');
});

test('PublishArticleWhenReadyJob does nothing if the article no longer exists', function () {
    (new PublishArticleWhenReadyJob(999999))->handle(app(NewsArticleService::class));
})->throwsNoExceptions();

test('when a job dies before handle() runs (ej. MaxAttemptsExceededException por un worker reiniciado), failed() marca el run como fallado en vez de dejarlo colgado', function () {
    $cluster = NewsCluster::factory()->create(['status' => 'pending']);
    $job = new AcceptNewsClusterJob('un-run-id-de-prueba', $cluster, null);

    $job->failed(new Exception('el worker murió a mitad de camino'));

    $status = JobRunStatus::get('un-run-id-de-prueba');

    expect($status['status'])->toBe('failed')
        ->and($status['error'])->toBe('el worker murió a mitad de camino');
});

test('the narration job is also dispatched loose, when audio auto-generate is on', function () {
    Bus::fake();

    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create([
        'provider' => 'google-tts',
        'is_active_for_audio' => true,
        'auto_generate_narration' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([fakeArticleDraftResponse()]);

    $cluster = NewsCluster::factory()->create(['category' => 'anime']);

    app(NewsArticleService::class)->createFromCluster($cluster);

    Bus::assertDispatched(GenerateArticleNarrationJob::class);
    Bus::assertDispatched(fn (PublishArticleWhenReadyJob $job) => $job->delay !== null);
});

test('createFromCluster publishes right away, with no delay, when no image or audio job is dispatched', function () {
    Bus::fake();

    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);

    Prism::fake([fakeArticleDraftResponse()]);

    $cluster = NewsCluster::factory()->create(['category' => 'anime']);

    app(NewsArticleService::class)->createFromCluster($cluster);

    Bus::assertNotDispatched(GenerateArticleFeaturedImageJob::class);
    Bus::assertNotDispatched(GenerateArticleNarrationJob::class);
    Bus::assertDispatched(fn (PublishArticleWhenReadyJob $job) => $job->delay === null);
});

test('publishing does not depend on the image job succeeding: it still publishes even if that job fails at the framework level', function () {
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create([
        'provider' => 'gemini',
        'is_active_for_images' => true,
        'auto_generate_featured_image' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([fakeArticleDraftResponse()]);

    $cluster = NewsCluster::factory()->create(['category' => 'anime']);
    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    // Simula lo que pasó en producción: el job de portada nunca llega a
    // correr su handle() (ej. MaxAttemptsExceededException por un
    // reinicio del worker a mitad de camino) — acá directamente no lo
    // ejecutamos. Publicar no dependía de él: al no estar encadenados, el
    // suyo (con su propio timing/delay independiente) sigue en pie.
    (new PublishArticleWhenReadyJob($article->id))->handle(app(NewsArticleService::class));

    expect($article->fresh()->status)->toBe('published');
});
