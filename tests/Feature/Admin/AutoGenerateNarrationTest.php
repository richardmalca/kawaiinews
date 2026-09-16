<?php

use App\Jobs\GenerateArticleNarrationJob;
use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\User;
use App\Services\Admin\MediaLibraryService;
use App\Services\Admin\NewsArticleService;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

test('createFromCluster dispatches the narration job only when enabled on the active audio provider', function () {
    Queue::fake();

    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create([
        'provider' => 'google-tts',
        'is_active_for_audio' => true,
        'auto_generate_narration' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular
            RESUMEN: Un resumen.
            CUERPO: <p>Cuerpo.</p>
            CATEGORIA: gaming
            TAGS:
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['category' => 'gaming']);
    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    Queue::assertPushed(GenerateArticleNarrationJob::class, fn ($job) => $job->newsArticleId === $article->id);
});

test('createFromCluster does not dispatch the narration job when it is off', function () {
    Queue::fake();

    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create([
        'provider' => 'google-tts',
        'is_active_for_audio' => true,
        'auto_generate_narration' => false,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular
            RESUMEN: Un resumen.
            CUERPO: <p>Cuerpo.</p>
            CATEGORIA: gaming
            TAGS:
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['category' => 'gaming']);
    app(NewsArticleService::class)->createFromCluster($cluster);

    Queue::assertNotPushed(GenerateArticleNarrationJob::class);
});

test('the job generates the narration and sets audio_url on the article', function () {
    Storage::fake('public');

    AiProvider::factory()->create(['provider' => 'google-tts', 'api_key' => 'test-key', 'is_active_for_audio' => true]);
    Http::fake([
        'texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('fake-mp3-bytes')]),
    ]);

    $article = NewsArticle::factory()->create([
        'title' => 'Un titular',
        'excerpt' => 'Un resumen',
        'body' => '<p>Cuerpo de la noticia.</p>',
        'audio_url' => null,
    ]);

    (new GenerateArticleNarrationJob($article->id))->handle(app(MediaLibraryService::class));

    expect($article->fresh()->audio_url)->not->toBeNull();
    expect(Media::where('news_article_id', $article->id)->where('type', 'audio')->count())->toBe(1);
});

test('the job does nothing when the article already has an audio_url', function () {
    AiProvider::factory()->create(['provider' => 'google-tts', 'api_key' => 'test-key', 'is_active_for_audio' => true]);

    $article = NewsArticle::factory()->create(['audio_url' => 'https://otra.test/ya-tenia.mp3']);

    (new GenerateArticleNarrationJob($article->id))->handle(app(MediaLibraryService::class));

    expect($article->fresh()->audio_url)->toBe('https://otra.test/ya-tenia.mp3');
    expect(Media::where('news_article_id', $article->id)->count())->toBe(0);
});

test('a superadmin can toggle auto-generate narration for a provider', function () {
    $this->seed(RoleSeeder::class);
    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);

    $provider = AiProvider::factory()->create(['provider' => 'google-tts', 'is_active_for_audio' => true]);

    $this->post(route('admin.ai-providers.toggle-auto-generate-narration', $provider), ['enabled' => true])
        ->assertRedirect();

    expect($provider->fresh()->auto_generate_narration)->toBeTrue();
});
