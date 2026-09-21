<?php

use App\Jobs\BuildRadioQueueJob;
use App\Models\NewsArticle;
use App\Models\RadioQueueItem;
use App\Models\RadioTrack;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('superadmin');
    $this->actingAs($admin);
});

test('the radio admin page lists tracks and the current queue', function () {
    RadioTrack::factory()->create(['title' => 'Chill Beats']);
    $article = NewsArticle::factory()->create();
    RadioQueueItem::factory()->create(['position' => 1, 'title' => 'Chill Beats', 'type' => 'music']);
    RadioQueueItem::factory()->create(['position' => 2, 'title' => $article->title, 'type' => 'article', 'news_article_id' => $article->id]);

    $response = $this->get(route('admin.radio.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/radio/index')
        ->has('tracks', 1)
        ->has('queue', 2)
    );
});

test('a track can be uploaded from the admin panel', function () {
    Storage::fake('public');

    $response = $this->postJson(route('admin.radio.tracks.store'), [
        'file' => UploadedFile::fake()->create('lofi.mp3', 3000, 'audio/mpeg'),
        'title' => 'Chill Beats',
        'artist' => 'Someone',
    ]);

    $response->assertOk()->assertJsonPath('title', 'Chill Beats');
    $this->assertDatabaseHas('radio_tracks', ['title' => 'Chill Beats', 'artist' => 'Someone']);
});

test('uploading a track without a title is rejected', function () {
    Storage::fake('public');

    $response = $this->postJson(route('admin.radio.tracks.store'), [
        'file' => UploadedFile::fake()->create('lofi.mp3', 3000, 'audio/mpeg'),
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['title']);
});

test('a track can be deleted from the admin panel', function () {
    $track = RadioTrack::factory()->create();

    $response = $this->deleteJson(route('admin.radio.tracks.destroy', $track));

    $response->assertOk();
    $this->assertModelMissing($track);
});

test('rebuilding the queue queues a job and returns a run id', function () {
    Queue::fake();

    $response = $this->postJson(route('admin.radio.rebuild-queue'));

    $response->assertOk()->assertJsonStructure(['run_id']);
    Queue::assertPushed(BuildRadioQueueJob::class, 1);
});

test('rebuilding the queue twice while the first is still running does not queue a second job', function () {
    Queue::fake();

    $first = $this->postJson(route('admin.radio.rebuild-queue'))->json();
    expect($first['already_running'])->toBeFalse();

    $second = $this->postJson(route('admin.radio.rebuild-queue'))->json();
    expect($second['already_running'])->toBeTrue()
        ->and($second['run_id'])->toBe($first['run_id']);

    Queue::assertPushed(BuildRadioQueueJob::class, 1);
});

test('an editor cannot access the radio panel', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');

    $response = $this->actingAs($editor)->get(route('admin.radio.index'));

    $response->assertForbidden();
});

test('the public radio queue endpoint serves the current queue', function () {
    RadioQueueItem::factory()->create(['position' => 1, 'title' => 'Chill Beats', 'audio_url' => 'https://cdn.test/chill.mp3']);

    $response = $this->getJson(route('public.radio.queue'));

    $response->assertOk();
    $response->assertJsonPath('queue.0.title', 'Chill Beats');
    $response->assertJsonPath('queue.0.audio_url', 'https://cdn.test/chill.mp3');
});

test('the public radio queue endpoint reports the same playback position for two listeners hitting it at the same time (regression: raw unix time made a fresh rebuild start mid-queue at random)', function () {
    $startedAt = now()->subSeconds(125);

    RadioQueueItem::factory()->create([
        'position' => 1,
        'type' => 'music',
        'title' => 'Track A',
        'duration_seconds' => 100,
        'created_at' => $startedAt,
    ]);
    RadioQueueItem::factory()->create([
        'position' => 2,
        'type' => 'article',
        'title' => 'Track B',
        'duration_seconds' => 100,
        'created_at' => $startedAt,
    ]);

    $first = $this->getJson(route('public.radio.queue'))->json();
    $second = $this->getJson(route('public.radio.queue'))->json();

    // 125s desde que arrancó: los primeros 100s son el item 0, así que a
    // los 125s tiene que estar en el item 1, ~25s adentro.
    expect($first['current_track_index'])->toBe(1)
        ->and($first['current_track_offset'])->toBeGreaterThanOrEqual(24)
        ->and($first['current_track_offset'])->toBeLessThanOrEqual(26)
        ->and($first)->toEqual($second);
});
