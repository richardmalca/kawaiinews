<?php

use App\Jobs\GenerateMediaJob;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\User;
use App\Services\Admin\MediaLibraryService;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('a media item can be deleted from the library', function () {
    $media = Media::factory()->create();

    $response = $this->deleteJson(route('admin.media.destroy', $media));

    $response->assertOk();
    $this->assertModelMissing($media);
});

test('an audio file can be uploaded to the media library', function () {
    Storage::fake('public');

    $article = NewsArticle::factory()->create();
    $file = UploadedFile::fake()->create('narration.mp3', 500, 'audio/mpeg');

    $response = $this->postJson(route('admin.audio.store'), [
        'file' => $file,
        'news_article_id' => $article->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('type', 'audio')
        ->assertJsonPath('news_article_id', $article->id)
        ->assertJsonPath('source', 'upload');

    $this->assertDatabaseHas('media', [
        'type' => 'audio',
        'source' => 'upload',
        'original_name' => 'narration.mp3',
        'news_article_id' => $article->id,
    ]);
});

test('audio upload rejects non audio files', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->postJson(route('admin.audio.store'), [
        'file' => $file,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);
});

test('generating an image queues a job and locks the article (regression: could be triggered twice while generating)', function () {
    Queue::fake();

    $article = NewsArticle::factory()->create();

    $first = $this->postJson(route('admin.media.generate'), [
        'prompt' => 'Un dibujo de un gato ninja',
        'news_article_id' => $article->id,
    ])->assertOk()->json();

    expect($first['already_running'])->toBeFalse();
    Queue::assertPushed(GenerateMediaJob::class, 1);

    // Segundo intento mientras el primero "sigue corriendo" (no llamamos
    // al job real porque Queue::fake() no lo ejecuta): no debe encolar
    // otro job, tiene que devolver el mismo run_id del que ya está activo.
    $second = $this->postJson(route('admin.media.generate'), [
        'prompt' => 'Otro prompt distinto',
        'news_article_id' => $article->id,
    ])->assertOk()->json();

    expect($second['already_running'])->toBeTrue()
        ->and($second['run_id'])->toBe($first['run_id']);
    Queue::assertPushed(GenerateMediaJob::class, 1);
});

test('the job releases the article lock when it finishes, on success or failure (regression: a stale worker left a lock stuck forever)', function () {
    $article = NewsArticle::factory()->create();
    $mediaLibraryService = app(MediaLibraryService::class);

    $mediaLibraryService->lockGeneration($article->id, 'a-run-id');
    expect($mediaLibraryService->activeGenerationRunId($article->id))->toBe('a-run-id');

    // Sin proveedor de IA configurado, generateWithAi() tira una excepción
    // antes de pegarle a ninguna API real — igual pasa por el finally del
    // job, que es lo que queremos probar acá.
    (new GenerateMediaJob('a-run-id', 'un prompt', $article->id))->handle($mediaLibraryService);

    expect($mediaLibraryService->activeGenerationRunId($article->id))->toBeNull();
});

test('the generation status endpoint reports whether an article has an image being generated', function () {
    $article = NewsArticle::factory()->create();

    $this->getJson(route('admin.media.generation-status', $article))
        ->assertOk()
        ->assertJson(['run_id' => null]);

    app(MediaLibraryService::class)->lockGeneration($article->id, 'fake-run-id');

    $this->getJson(route('admin.media.generation-status', $article))
        ->assertOk()
        ->assertJson(['run_id' => 'fake-run-id']);
});

test('image upload rejects svg files', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->create('malicioso.svg', 10, 'image/svg+xml');

    $response = $this->postJson(route('admin.media.store'), [
        'file' => $file,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);
});
