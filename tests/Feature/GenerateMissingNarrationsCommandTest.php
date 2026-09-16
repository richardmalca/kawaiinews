<?php

use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

test('it generates audio for every article missing it', function () {
    Storage::fake('public');
    AiProvider::factory()->create(['provider' => 'google-tts', 'api_key' => 'test-key', 'is_active_for_audio' => true]);
    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('fake-mp3-bytes')]),
    ]);

    $withAudio = NewsArticle::factory()->create(['audio_url' => 'https://ya.test/tenia.mp3']);
    $withoutAudio1 = NewsArticle::factory()->create(['audio_url' => null]);
    $withoutAudio2 = NewsArticle::factory()->create(['audio_url' => '']);

    $this->artisan('app:generate-missing-narrations')
        ->expectsOutputToContain('Generados: 2. Fallidos: 0.')
        ->assertSuccessful();

    expect($withAudio->fresh()->audio_url)->toBe('https://ya.test/tenia.mp3')
        ->and($withoutAudio1->fresh()->audio_url)->not->toBeNull()
        ->and($withoutAudio2->fresh()->audio_url)->not->toBeNull();

    expect(Media::where('type', 'audio')->count())->toBe(2);
});

test('--dry-run reports what would change without generating anything', function () {
    AiProvider::factory()->create(['provider' => 'google-tts', 'api_key' => 'test-key', 'is_active_for_audio' => true]);

    $article = NewsArticle::factory()->create(['audio_url' => null, 'title' => 'Un titular bien único para este test']);

    $this->artisan('app:generate-missing-narrations --dry-run')
        ->expectsOutputToContain('Un titular bien único para este test')
        ->expectsOutputToContain('1 artículo(s) generarían audio.')
        ->assertSuccessful();

    expect($article->fresh()->audio_url)->toBeNull();
    expect(Media::count())->toBe(0);
});

test('it counts failures without stopping the rest', function () {
    Storage::fake('public');
    AiProvider::factory()->create(['provider' => 'google-tts', 'api_key' => 'test-key', 'is_active_for_audio' => true]);

    $bad = NewsArticle::factory()->create(['audio_url' => null]);
    $good = NewsArticle::factory()->create(['audio_url' => null]);

    Http::fake([
        'texttospeech.googleapis.com/*' => Http::sequence()
            ->push(['error' => 'boom'], 500)
            ->push(['audioContent' => base64_encode('fake-mp3-bytes')]),
    ]);

    $this->artisan('app:generate-missing-narrations')
        ->expectsOutputToContain('Generados: 1. Fallidos: 1.')
        ->assertSuccessful();

    expect($bad->fresh()->audio_url)->toBeNull()
        ->and($good->fresh()->audio_url)->not->toBeNull();
});

test('it does nothing when every article already has audio', function () {
    NewsArticle::factory()->create(['audio_url' => 'https://ya.test/tenia.mp3']);

    $this->artisan('app:generate-missing-narrations')
        ->expectsOutputToContain('Todos los artículos ya tienen audio.')
        ->assertSuccessful();
});
