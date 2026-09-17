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

test('createFromCluster chains publish after the image/audio jobs instead of dispatching them loose', function () {
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

    Bus::assertChained([
        GenerateArticleFeaturedImageJob::class,
        PublishArticleWhenReadyJob::class,
    ]);
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

test('the narration job is chained before publish too, when audio auto-generate is on', function () {
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

    Bus::assertChained([
        GenerateArticleNarrationJob::class,
        PublishArticleWhenReadyJob::class,
    ]);
});
