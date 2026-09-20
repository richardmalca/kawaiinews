<?php

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\RadioQueueItem;
use App\Models\RadioTrack;
use App\Services\Admin\RadioService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

beforeEach(function () {
    Storage::fake('public');
});

test('a track can be uploaded and removed', function () {
    $file = UploadedFile::fake()->create('lofi.mp3', 3000, 'audio/mpeg');

    $track = app(RadioService::class)->addTrack($file, 'Chill Beats', 'Someone');

    expect($track->title)->toBe('Chill Beats')
        ->and($track->artist)->toBe('Someone')
        ->and($track->url)->not->toBeEmpty();

    app(RadioService::class)->removeTrack($track);

    $this->assertModelMissing($track);
});

test('building the queue without any active music track does nothing', function () {
    NewsArticle::factory()->create(['status' => 'published', 'audio_url' => 'https://cdn.test/a.mp3']);

    $result = app(RadioService::class)->buildQueue();

    expect($result['skipped_no_music'])->toBeTrue()
        ->and($result['queued'])->toBe(0);
    expect(RadioQueueItem::count())->toBe(0);
});

test('building the queue alternates music and narrated articles, generating a dj intro with ai', function () {
    RadioTrack::factory()->create(['title' => 'Chill Beats', 'active' => true]);

    AiProvider::factory()->create([
        'provider' => 'openai',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);
    AiProvider::factory()->create([
        'provider' => 'google-tts',
        'is_active_for_audio' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([TextResponseFake::make()->withText('¡Prepárense para esta noticia bomba!')]);
    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('fake-mp3-bytes')]),
    ]);

    $article = NewsArticle::factory()->create([
        'status' => 'published',
        'audio_url' => 'https://cdn.test/narration.mp3',
        'published_at' => now(),
    ]);

    $result = app(RadioService::class)->buildQueue();

    expect($result['queued'])->toBe(2)
        ->and($result['skipped_no_audio'])->toBe(0);

    $items = RadioQueueItem::orderBy('position')->get();
    expect($items[0]->type)->toBe('music')
        ->and($items[1]->type)->toBe('article')
        ->and($items[1]->news_article_id)->toBe($article->id);

    $article->refresh();
    expect($article->dj_intro_url)->not->toBeNull()
        ->and($items[1]->audio_url)->toBe($article->dj_intro_url);
});

test('rebuilding the queue reuses an already generated dj intro instead of calling ai again', function () {
    RadioTrack::factory()->create(['active' => true]);
    AiProvider::factory()->create(['provider' => 'openai', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'google-tts', 'is_active_for_audio' => true, 'api_key' => 'test-key']);

    Prism::fake([TextResponseFake::make()->withText('Frase del DJ')]);
    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('fake-mp3-bytes')]),
    ]);

    NewsArticle::factory()->create(['status' => 'published', 'audio_url' => 'https://cdn.test/narration.mp3']);

    app(RadioService::class)->buildQueue();
    app(RadioService::class)->buildQueue();

    Http::assertSentCount(1);
});

test('articles without narration are left out of the queue', function () {
    RadioTrack::factory()->create(['active' => true]);
    NewsArticle::factory()->create(['status' => 'published', 'audio_url' => null]);

    $result = app(RadioService::class)->buildQueue();

    expect($result['queued'])->toBe(0)
        ->and($result['skipped_no_audio'])->toBe(1);
});
