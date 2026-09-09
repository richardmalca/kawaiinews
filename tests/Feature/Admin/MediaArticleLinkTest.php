<?php

use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Services\Admin\MediaLibraryService;
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
});

test('audio library only lists audio media, not images', function () {
    $article = NewsArticle::factory()->create();
    Media::factory()->create(['news_article_id' => $article->id]);
    Media::factory()->audio()->create(['news_article_id' => $article->id]);

    $audios = app(MediaLibraryService::class)->listAudio();

    expect($audios)->toHaveCount(1)
        ->and($audios->first()->type)->toBe('audio');
});
