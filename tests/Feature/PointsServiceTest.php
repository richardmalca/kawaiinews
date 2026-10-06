<?php

use App\Models\NewsArticle;
use App\Models\User;
use App\Services\Public\PointsService;

test('award crea una transacción con los puntos correctos por tipo', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create();
    $service = app(PointsService::class);

    $transaction = $service->award($user, PointsService::VIEW_ARTICLE, $article);

    expect($transaction->points)->toBe(1)
        ->and($transaction->user_id)->toBe($user->id)
        ->and($transaction->subject_id)->toBe($article->id);

    $this->assertDatabaseCount('point_transactions', 1);
});

test('award otorga 5 puntos por trivia correcta', function () {
    $user = User::factory()->create();
    $service = app(PointsService::class);

    $transaction = $service->award($user, PointsService::TRIVIA_CORRECT);

    expect($transaction->points)->toBe(5);
});
