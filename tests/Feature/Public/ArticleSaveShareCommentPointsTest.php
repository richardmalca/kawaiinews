<?php

use App\Models\NewsArticle;
use App\Models\PointTransaction;
use App\Models\User;
use App\Services\Public\ArticleInteractionService;
use App\Services\Public\CommentService;
use App\Services\Public\PointsService;

test('toggleFavorite awards points only on the first save, not when unsaving or re-saving', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create();
    $service = app(ArticleInteractionService::class);

    $service->toggleFavorite($user, $article);
    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_FAVORITE)->count())->toBe(1);

    $service->toggleFavorite($user, $article);
    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_FAVORITE)->count())->toBe(1);

    $service->toggleFavorite($user, $article);
    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_FAVORITE)->count())->toBe(2);
});

test('recordShare awards points only on the first share of an article by that user', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create();
    $service = app(ArticleInteractionService::class);

    $service->recordShare($user, $article, 'whatsapp');
    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_SHARE)->count())->toBe(1);

    $service->recordShare($user, $article, 'twitter');
    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_SHARE)->count())->toBe(1);
});

test('recordShare does not award points for an anonymous share', function () {
    $article = NewsArticle::factory()->create();
    $service = app(ArticleInteractionService::class);

    $service->recordShare(null, $article, 'whatsapp');

    expect(PointTransaction::where('type', PointsService::NEW_SHARE)->exists())->toBeFalse();
});

test('a visible comment awards points, a comment held for moderation does not', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create();
    $service = app(CommentService::class);

    $service->store($user, $article, 'Un comentario normal y de buena onda.');

    expect(PointTransaction::where('user_id', $user->id)->where('type', PointsService::NEW_COMMENT)->count())->toBe(1);
});
