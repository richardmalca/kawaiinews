<?php

use App\Models\AiProvider;
use App\Models\AiUsageLog;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Services\Admin\MediaLibraryService;
use Illuminate\Support\Facades\Http;
use Prism\Prism\Audio\AudioResponse;
use Prism\Prism\Facades\Prism;
use Prism\Prism\ValueObjects\GeneratedAudio;

test('uploaded and generated images can be linked to their article', function () {
    $article = NewsArticle::factory()->create();

    $media = app(MediaLibraryService::class)->storeFromUrl('https://example.test/img.png', $article->id);

    expect($media->type)->toBe('image')
        ->and($media->news_article_id)->toBe($article->id);

    $article->refresh();
    expect($article->media()->count())->toBe(1);
});

test('generating a narration creates an audio media item linked to the article', function () {
    AiProvider::factory()->create([
        'provider' => 'openai',
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        new AudioResponse(audio: new GeneratedAudio(base64: base64_encode('fake-mp3-bytes'), type: 'audio/mpeg')),
    ]);

    $article = NewsArticle::factory()->create([
        'title' => 'Una noticia con narración',
        'excerpt' => 'Resumen de prueba',
        'body' => '<p>Cuerpo de la noticia de prueba.</p>',
    ]);

    $media = app(MediaLibraryService::class)->generateNarration($article);

    expect($media->type)->toBe('audio')
        ->and($media->news_article_id)->toBe($article->id)
        ->and($media->source)->toBe('ai');

    expect(Media::where('type', 'audio')->where('news_article_id', $article->id)->count())->toBe(1);

    // Antes, generar audio no dejaba ningún registro en ai_usage_logs —
    // por eso el costo de narración nunca aparecía en Costo de IA ni en
    // Mis noticias, aunque las llamadas a OpenAI/ElevenLabs sí gastaban.
    $log = AiUsageLog::where('kind', 'audio')->first();
    expect($log)->not->toBeNull()
        ->and($log->subject_id)->toBe($article->id);
});

test('generating a narration with Google Cloud Text-to-Speech calls its REST API directly (Prism does not support it)', function () {
    AiProvider::factory()->create([
        'provider' => 'google-tts',
        'api_key' => 'test-key',
    ]);

    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response([
            'audioContent' => base64_encode('fake-mp3-bytes'),
        ]),
    ]);

    $article = NewsArticle::factory()->create([
        'title' => 'Una noticia con narración de Google',
        'excerpt' => 'Resumen de prueba',
        'body' => '<p>Cuerpo de la noticia de prueba.</p>',
    ]);

    $media = app(MediaLibraryService::class)->generateNarration($article);

    expect($media->type)->toBe('audio')
        ->and($media->provider)->toBe('google-tts');

    Http::assertSent(fn ($request) => str_contains($request->url(), 'texttospeech.googleapis.com')
        && $request['voice']['name'] === 'es-US-Wavenet-B'
        && str_starts_with($request['input']['ssml'], '<speak>'));

    $log = AiUsageLog::where('kind', 'audio')->where('provider', 'google-tts')->first();
    expect($log)->not->toBeNull()
        ->and($log->prompt_tokens)->toBeGreaterThan(0)
        ->and($log->completion_tokens)->toBe(0);
});

test('the Google TTS narration inserts an explicit SSML break after subheadings, not just a period', function () {
    AiProvider::factory()->create([
        'provider' => 'google-tts',
        'api_key' => 'test-key',
    ]);

    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response([
            'audioContent' => base64_encode('fake-mp3-bytes'),
        ]),
    ]);

    $article = NewsArticle::factory()->create([
        'title' => 'Título',
        'excerpt' => null,
        'body' => '<h3>Un subtítulo sin punto</h3><p>El párrafo que sigue.</p>',
    ]);

    app(MediaLibraryService::class)->generateNarration($article);

    // Antes: un punto normal de oración, que Google TTS lee con una pausa
    // demasiado corta para notarse entre el subtítulo y el párrafo. Ahora:
    // una pausa SSML explícita entre cada bloque.
    Http::assertSent(fn ($request) => str_contains(
        $request['input']['ssml'],
        'Un subtítulo sin punto. <break time="650ms"/> El párrafo que sigue.'
    ));
});

test('the narration script for non-SSML providers still gets a period after subheadings', function () {
    AiProvider::factory()->create([
        'provider' => 'openai',
        'api_key' => 'test-key',
    ]);

    $fake = Prism::fake([
        new AudioResponse(audio: new GeneratedAudio(base64: base64_encode('fake-mp3-bytes'), type: 'audio/mpeg')),
    ]);

    $article = NewsArticle::factory()->create([
        'title' => 'Título',
        'excerpt' => null,
        'body' => '<h3>Un subtítulo sin punto</h3><p>El párrafo que sigue.</p>',
    ]);

    app(MediaLibraryService::class)->generateNarration($article);

    $fake->assertRequest(function (array $requests) {
        expect($requests[0]->input())->toContain('Un subtítulo sin punto. El párrafo que sigue.');
    });
});

test('audio library only lists audio media, not images', function () {
    $article = NewsArticle::factory()->create();
    Media::factory()->create(['news_article_id' => $article->id]);
    Media::factory()->audio()->create(['news_article_id' => $article->id]);

    $audios = app(MediaLibraryService::class)->listAudio();

    expect($audios)->toHaveCount(1)
        ->and($audios->first()->type)->toBe('audio');
});
