<?php

use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
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

test('image upload rejects svg files', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->create('malicioso.svg', 10, 'image/svg+xml');

    $response = $this->postJson(route('admin.media.store'), [
        'file' => $file,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);
});
