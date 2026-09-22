<?php

use App\Jobs\GenerateAudioJob;
use App\Jobs\GenerateMediaJob;
use App\Jobs\MigrateMediaStorageJob;
use App\Jobs\RenameMediaFilesJob;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\StorageSetting;
use App\Models\User;
use App\Services\Admin\MediaLibraryService;
use App\Support\RemoteStorage;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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

test('an image is stored on the remote disk when storage is active for media', function () {
    Storage::fake('public');
    Storage::fake(RemoteStorage::DISK_NAME);

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
        'active_for_media' => true,
    ]);

    $file = UploadedFile::fake()->image('cover.jpg');

    $response = $this->postJson(route('admin.media.store'), ['file' => $file]);

    $response->assertOk();

    // El archivo termina en el disco remoto (fake), no en el local público
    // — el fake de Storage no respeta la URL configurada, así que la
    // comprobación real es "existe en el disco remoto" / "no existe en el
    // local", no comparar la URL contra un dominio.
    $remoteFiles = Storage::disk(RemoteStorage::DISK_NAME)->allFiles();
    expect($remoteFiles)->not->toBeEmpty();
    Storage::disk(RemoteStorage::DISK_NAME)->assertExists($remoteFiles[0]);
    Storage::disk('public')->assertDirectoryEmpty('media');
});

test('an uploaded image is optimized to webp and resized down if oversized', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('cover.jpg', 3000, 1500);

    $response = $this->postJson(route('admin.media.store'), ['file' => $file]);

    $response->assertOk();

    $media = Media::latest('id')->first();
    expect($media->url)->toEndWith('.webp');

    $path = Str::after($media->url, Storage::disk('public')->url(''));
    $stored = imagecreatefromstring(Storage::disk('public')->get($path));
    expect(imagesx($stored))->toBeLessThanOrEqual(1920)
        ->and(imagesy($stored))->toBeLessThanOrEqual(1920);
});

test('an uploaded image also gets a smaller card variant for listings/cards', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('cover.jpg', 3000, 1500);

    $response = $this->postJson(route('admin.media.store'), ['file' => $file]);

    $response->assertOk();

    $media = Media::latest('id')->first();
    expect($media->card_url)->not->toBeNull()
        ->and($media->card_url)->not->toBe($media->url);

    $cardPath = Str::after($media->card_url, Storage::disk('public')->url(''));
    Storage::disk('public')->assertExists($cardPath);

    $card = imagecreatefromstring(Storage::disk('public')->get($cardPath));
    expect(imagesx($card))->toBeLessThanOrEqual(900)
        ->and(imagesy($card))->toBeLessThanOrEqual(900);
});

test('countByLocation reports how many files are local and how many are remote', function () {
    Storage::fake('public');
    // Con una url propia: el fake local por defecto arma la misma pinta de
    // url para cualquier disco ("/storage/..."), así que sin esto no hay
    // forma de distinguir un archivo local de uno remoto en la prueba.
    Storage::fake(RemoteStorage::DISK_NAME, ['url' => 'https://e.test/b']);

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    $localUrl = Storage::disk('public')->url('media/local.webp');
    $remoteUrl = Storage::disk(RemoteStorage::DISK_NAME)->url('media/remote.webp');

    Media::factory()->create(['type' => 'image', 'url' => $localUrl]);
    Media::factory()->create(['type' => 'image', 'url' => $remoteUrl]);
    Media::factory()->create(['type' => 'image', 'url' => $remoteUrl]);

    $counts = app(MediaLibraryService::class)->countByLocation();

    expect($counts)->toBe(['local' => 1, 'remote' => 2]);
});

test('migrateAll moves local files to the remote disk and updates their url', function () {
    Storage::fake('public');
    Storage::fake(RemoteStorage::DISK_NAME, ['url' => 'https://e.test/b']);

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    Storage::disk('public')->put('media/photo.webp', 'contenido');
    $media = Media::factory()->create([
        'type' => 'image',
        'url' => Storage::disk('public')->url('media/photo.webp'),
    ]);

    $result = app(MediaLibraryService::class)->migrateAll('remote');

    expect($result)->toBe(['moved' => 1, 'already_there' => 0, 'failed' => 0, 'optimized' => 0]);
    Storage::disk('public')->assertMissing('media/photo.webp');
    expect($media->fresh()->url)->toStartWith(Storage::disk(RemoteStorage::DISK_NAME)->url(''));
});

test('migrateAll also optimizes images that were uploaded before webp conversion existed', function () {
    Storage::fake('public');
    Storage::fake(RemoteStorage::DISK_NAME, ['url' => 'https://e.test/b']);

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    $image = imagecreatetruecolor(800, 600);
    imagefill($image, 0, 0, imagecolorallocate($image, 200, 50, 50));
    ob_start();
    imagepng($image);
    $original = ob_get_clean();
    imagedestroy($image);
    Storage::disk('public')->put('media/old-photo.png', $original);
    $media = Media::factory()->create([
        'type' => 'image',
        'url' => Storage::disk('public')->url('media/old-photo.png'),
    ]);

    $result = app(MediaLibraryService::class)->migrateAll('remote');

    expect($result)->toBe(['moved' => 1, 'already_there' => 0, 'failed' => 0, 'optimized' => 1]);
    expect($media->fresh()->url)->toEndWith('.webp');

    $remotePath = Str::after($media->fresh()->url, Storage::disk(RemoteStorage::DISK_NAME)->url(''));
    $stored = Storage::disk(RemoteStorage::DISK_NAME)->get($remotePath);
    expect(strlen($stored))->toBeLessThan(strlen($original));
});

test('renameAll unifies file names in place without changing their location', function () {
    Storage::fake('public');

    Storage::disk('public')->put('media/nombre-original-del-cliente.webp', 'contenido');
    $media = Media::factory()->create([
        'type' => 'image',
        'url' => Storage::disk('public')->url('media/nombre-original-del-cliente.webp'),
    ]);

    $result = app(MediaLibraryService::class)->renameAll();

    expect($result)->toBe(['renamed' => 1, 'already_ok' => 0, 'failed' => 0, 'optimized' => 0]);
    Storage::disk('public')->assertMissing('media/nombre-original-del-cliente.webp');

    $newUrl = $media->fresh()->url;
    expect($newUrl)->not->toContain('nombre-original-del-cliente')
        ->and($newUrl)->toEndWith('.webp')
        ->and(Str::after($newUrl, Storage::disk('public')->url('')))->toStartWith('media/img-');
});

test('renameAll also optimizes old images that were not webp yet', function () {
    Storage::fake('public');

    $image = imagecreatetruecolor(800, 600);
    imagefill($image, 0, 0, imagecolorallocate($image, 10, 20, 30));
    ob_start();
    imagepng($image);
    $original = ob_get_clean();
    imagedestroy($image);
    Storage::disk('public')->put('media/vieja.png', $original);
    $media = Media::factory()->create([
        'type' => 'image',
        'url' => Storage::disk('public')->url('media/vieja.png'),
    ]);

    $result = app(MediaLibraryService::class)->renameAll();

    expect($result)->toBe(['renamed' => 1, 'already_ok' => 0, 'failed' => 0, 'optimized' => 1]);
    expect($media->fresh()->url)->toEndWith('.webp');
});

test('migrateAll skips files already on the target and reports them separately', function () {
    Storage::fake('public');
    Storage::fake(RemoteStorage::DISK_NAME);

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    Media::factory()->create([
        'type' => 'image',
        'url' => Storage::disk('public')->url('media/already-local.webp'),
    ]);

    $result = app(MediaLibraryService::class)->migrateAll('local');

    expect($result)->toBe(['moved' => 0, 'already_there' => 1, 'failed' => 0, 'optimized' => 0]);
});

test('a superadmin can trigger a media migration and poll its result', function () {
    Storage::fake('public');
    Storage::fake(RemoteStorage::DISK_NAME);

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    Queue::fake();

    $response = $this->postJson(route('admin.storage-settings.media.migrate'), ['direction' => 'remote']);

    $response->assertOk()->assertJsonStructure(['run_id']);
    Queue::assertPushed(MigrateMediaStorageJob::class, fn ($job) => $job->direction === 'remote');
});

test('a superadmin can trigger a media rename and poll its result', function () {
    Storage::fake('public');

    Queue::fake();

    $response = $this->postJson(route('admin.storage-settings.media.rename'));

    $response->assertOk()->assertJsonStructure(['run_id']);
    Queue::assertPushed(RenameMediaFilesJob::class);
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

test('generating audio queues a job and locks the article, independently from the image lock (regression: could be triggered twice while generating)', function () {
    Queue::fake();

    $article = NewsArticle::factory()->create();

    $first = $this->postJson(route('admin.news-articles.audio.generate', $article))
        ->assertOk()->json();

    expect($first['already_running'])->toBeFalse();
    Queue::assertPushed(GenerateAudioJob::class, 1);

    // Segundo intento mientras el primero "sigue corriendo": no debe
    // encolar otro job, tiene que devolver el mismo run_id ya activo.
    $second = $this->postJson(route('admin.news-articles.audio.generate', $article))
        ->assertOk()->json();

    expect($second['already_running'])->toBeTrue()
        ->and($second['run_id'])->toBe($first['run_id']);
    Queue::assertPushed(GenerateAudioJob::class, 1);

    // Generar audio no debe quedar bloqueado por un lock de imagen (ni al
    // revés) — son operaciones independientes.
    app(MediaLibraryService::class)->lockGeneration($article->id, 'otro-run', 'image');

    $this->postJson(route('admin.media.generate'), [
        'prompt' => 'algo',
        'news_article_id' => $article->id,
    ])->assertOk()->assertJson(['already_running' => true]);

    Queue::assertPushed(GenerateAudioJob::class, 1);
});

test('the audio job releases the article lock when it finishes, on success or failure', function () {
    $article = NewsArticle::factory()->create();
    $mediaLibraryService = app(MediaLibraryService::class);

    $mediaLibraryService->lockGeneration($article->id, 'a-run-id', 'audio');
    expect($mediaLibraryService->activeGenerationRunId($article->id, 'audio'))->toBe('a-run-id');

    // Sin proveedor de IA configurado, generateNarration() tira una
    // excepción antes de pegarle a ninguna API real — igual pasa por el
    // finally del job, que es lo que queremos probar acá.
    (new GenerateAudioJob('a-run-id', $article))->handle($mediaLibraryService);

    expect($mediaLibraryService->activeGenerationRunId($article->id, 'audio'))->toBeNull();
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
