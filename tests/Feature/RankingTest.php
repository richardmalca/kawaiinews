<?php

use App\Models\PointTransaction;
use App\Models\User;
use App\Services\Public\PointsService;
use App\Services\Public\RankingService;

test('weeklyTop ordena usuarios por puntos de la semana actual, de mayor a menor', function () {
    $top = User::factory()->create();
    $second = User::factory()->create();
    $points = app(PointsService::class);

    $points->award($top, PointsService::TRIVIA_CORRECT); // 5
    $points->award($second, PointsService::VIEW_ARTICLE); // 1
    $points->award($second, PointsService::NEW_REACTION); // 1 -> total 2

    $ranking = app(RankingService::class)->weeklyTop();

    expect($ranking)->toHaveCount(2)
        ->and($ranking[0]['user_id'])->toBe($top->id)
        ->and($ranking[0]['points'])->toBe(5)
        ->and($ranking[0]['rank'])->toBe(1)
        ->and($ranking[1]['user_id'])->toBe($second->id)
        ->and($ranking[1]['points'])->toBe(2);
});

test('weeklyTop ignora puntos de semanas anteriores', function () {
    $user = User::factory()->create();
    app(PointsService::class)->award($user, PointsService::TRIVIA_CORRECT);

    PointTransaction::query()->update([
        'created_at' => now()->subWeeks(2),
    ]);

    $ranking = app(RankingService::class)->weeklyTop();

    expect($ranking)->toBeEmpty();
});

test('myPosition devuelve cero y rank nulo cuando el usuario no tiene puntos esta semana', function () {
    $user = User::factory()->create();

    $position = app(RankingService::class)->myPosition($user);

    expect($position)->toBe(['points' => 0, 'rank' => null]);
});

test('myPosition calcula el puesto real aunque el usuario no esté en el top', function () {
    $leader = User::factory()->create();
    $me = User::factory()->create();
    $points = app(PointsService::class);

    $points->award($leader, PointsService::TRIVIA_CORRECT); // 5
    $points->award($me, PointsService::VIEW_ARTICLE); // 1

    $position = app(RankingService::class)->myPosition($me);

    expect($position)->toBe(['points' => 1, 'rank' => 2]);
});

test('GET /api/ranking devuelve el top semanal', function () {
    $user = User::factory()->create();
    app(PointsService::class)->award($user, PointsService::TRIVIA_CORRECT);

    $response = $this->getJson('/api/ranking');

    $response->assertOk()
        ->assertJsonPath('ranking.0.user_id', $user->id)
        ->assertJsonPath('ranking.0.points', 5);
});
