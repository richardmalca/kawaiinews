<?php

use App\Models\NewsArticle;
use App\Models\RadioTrack;

test('the command reports how many items got queued', function () {
    RadioTrack::factory()->create(['active' => true]);
    NewsArticle::factory()->create(['status' => 'published', 'audio_url' => 'https://cdn.test/a.mp3']);

    $this->artisan('radio:build-queue')
        ->expectsOutputToContain('Cola reconstruida: 2 item(s).')
        ->assertExitCode(0);
});

test('the command fails clearly when there is no active music', function () {
    $this->artisan('radio:build-queue')
        ->expectsOutputToContain('No hay ninguna pista de música activa')
        ->assertExitCode(1);
});
