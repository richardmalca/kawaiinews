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
        '*' => Http::response('fake-audio-bytes', 200),
    ]);

    $article = NewsArticle::factory()->create([
        'status' => 'published',
        'audio_url' => 'https://cdn.test/narration.mp3',
        'published_at' => now(),
    ]);

    $result = app(RadioService::class)->buildQueue();

    expect($result['queued'])->toBe(2)
        ->and($result['skipped_no_audio'])->toBe(0);

    // En la radio solo suena la presentación corta del DJ, nunca la
    // noticia narrada completa — esa queda para el reproductor de audio
    // del artículo, no para la radio de fondo.
    $items = RadioQueueItem::orderBy('position')->get();
    expect($items[0]->type)->toBe('music')
        ->and($items[1]->type)->toBe('article')
        ->and($items[1]->news_article_id)->toBe($article->id);

    $article->refresh();
    expect($article->dj_intro_url)->not->toBeNull()
        ->and($items[1]->audio_url)->toBe($article->dj_intro_url)
        ->and($items[1]->audio_url)->not->toBe($article->audio_url);
});

test('an article without a dj intro yet falls back to the full narration instead of being left out', function () {
    RadioTrack::factory()->create(['active' => true]);
    // Sin proveedor de IA activo, no se puede generar la presentación del
    // DJ — la noticia igual tiene que sonar en la radio con su narración
    // completa, en vez de quedar afuera de la rotación.

    $article = NewsArticle::factory()->create([
        'status' => 'published',
        'audio_url' => 'https://cdn.test/narration.mp3',
    ]);

    Http::fake(['*' => Http::response('fake-audio-bytes', 200)]);

    $result = app(RadioService::class)->buildQueue();

    expect($result['queued'])->toBe(2);

    $items = RadioQueueItem::orderBy('position')->get();
    expect($items[1]->type)->toBe('article')
        ->and($items[1]->audio_url)->toBe($article->audio_url);

    expect($article->fresh()->dj_intro_url)->toBeNull();
});

test('the dj voice request to google tts includes a trailing pause, not just plain text (regression: audio ran straight into the next track)', function () {
    RadioTrack::factory()->create(['active' => true]);
    AiProvider::factory()->create(['provider' => 'openai', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'google-tts', 'is_active_for_audio' => true, 'api_key' => 'test-key']);

    Prism::fake([TextResponseFake::make()->withText('¡Prepárense para esta noticia bomba!')]);
    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('fake-mp3-bytes')]),
        '*' => Http::response('fake-audio-bytes', 200),
    ]);

    NewsArticle::factory()->create(['status' => 'published', 'audio_url' => 'https://cdn.test/narration.mp3']);

    app(RadioService::class)->buildQueue();

    Http::assertSent(function ($request) {
        $ssml = $request['input']['ssml'] ?? null;

        return $ssml
            && str_starts_with($ssml, '<speak>')
            && str_contains($ssml, '<break time="700ms"/>');
    });
});

test('rebuilding the queue reuses an already generated dj intro instead of calling ai again', function () {
    RadioTrack::factory()->create(['active' => true]);
    AiProvider::factory()->create(['provider' => 'openai', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'google-tts', 'is_active_for_audio' => true, 'api_key' => 'test-key']);

    Prism::fake([TextResponseFake::make()->withText('Frase del DJ')]);
    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('fake-mp3-bytes')]),
        '*' => Http::response('fake-audio-bytes', 200),
    ]);

    NewsArticle::factory()->create(['status' => 'published', 'audio_url' => 'https://cdn.test/narration.mp3']);

    app(RadioService::class)->buildQueue();
    app(RadioService::class)->buildQueue();

    // 1 sola llamada a la voz del DJ en total — la segunda vuelta reutiliza
    // dj_intro_url (y su duración ya cacheada), no vuelve a generar nada.
    Http::assertSentCount(1);
});

test('a filler dj phrase is intercalated every couple of music+article pairs', function () {
    RadioTrack::factory()->create(['active' => true]);
    AiProvider::factory()->create(['provider' => 'openai', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'google-tts', 'is_active_for_audio' => true, 'api_key' => 'test-key']);

    // 2 intros de noticia + 1 frase suelta + 1 intro más de noticia — una
    // por cada llamada de texto que dispara buildQueue() con 3 noticias.
    Prism::fake([
        TextResponseFake::make()->withText('Frase del DJ 1'),
        TextResponseFake::make()->withText('Frase del DJ 2'),
        TextResponseFake::make()->withText('Frase suelta del DJ'),
        TextResponseFake::make()->withText('Frase del DJ 3'),
    ]);
    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('fake-mp3-bytes')]),
        '*' => Http::response('fake-audio-bytes', 200),
    ]);

    NewsArticle::factory()->count(3)->create(['status' => 'published', 'audio_url' => 'https://cdn.test/narration.mp3']);

    $result = app(RadioService::class)->buildQueue();

    // 3 pares música+noticia (6 items) + 1 frase suelta del DJ intercalada
    // después del segundo par (FILLER_EVERY_N_PAIRS = 2).
    expect($result['queued'])->toBe(7);

    $items = RadioQueueItem::orderBy('position')->get();
    $fillers = $items->where('type', 'filler');

    expect($fillers)->toHaveCount(1)
        ->and($fillers->first()->news_article_id)->toBeNull()
        ->and($fillers->first()->radio_track_id)->toBeNull()
        ->and($fillers->first()->audio_url)->not->toBeEmpty();
});

test('articles without narration are left out of the queue', function () {
    RadioTrack::factory()->create(['active' => true]);
    NewsArticle::factory()->create(['status' => 'published', 'audio_url' => null]);

    $result = app(RadioService::class)->buildQueue();

    expect($result['queued'])->toBe(0)
        ->and($result['skipped_no_audio'])->toBe(1);
});
