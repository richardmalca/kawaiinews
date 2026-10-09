<?php

use App\Models\NewsArticle;
use App\Models\PointTransaction;
use App\Models\User;
use App\Services\Public\ArticleInteractionService;
use App\Services\Public\PointsService;

test('toggleLike awards points only on the first like, not when unliking or re-liking', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create();
    $service = app(ArticleInteractionService::class);

    $service->toggleLike($user, $article);

    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_LIKE)->count())->toBe(1);

    $service->toggleLike($user, $article);

    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_LIKE)->count())->toBe(1);

    $service->toggleLike($user, $article);

    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_LIKE)->count())->toBe(2);
});
