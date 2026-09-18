<?php

use App\Models\NewsArticle;
use App\Models\User;
use App\Services\Public\ArticleInteractionService;

test('favoriting an article always follows its category right away', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create(['category' => 'anime']);

    app(ArticleInteractionService::class)->toggleFavorite($user, $article);

    expect($user->isFollowingCategory('anime'))->toBeTrue();
});

test('unfavoriting does not unfollow the category', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create(['category' => 'anime']);
    $service = app(ArticleInteractionService::class);

    $service->toggleFavorite($user, $article); // guarda
    $service->toggleFavorite($user, $article); // saca de guardados

    expect($user->isFollowingCategory('anime'))->toBeTrue();
});

test('liking a single article does not follow its category yet', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create(['category' => 'gaming']);

    app(ArticleInteractionService::class)->toggleLike($user, $article);

    expect($user->isFollowingCategory('gaming'))->toBeFalse();
});

test('liking 3 different articles in the same category follows it', function () {
    $user = User::factory()->create();
    $articles = NewsArticle::factory()->count(3)->create(['category' => 'gaming']);
    $service = app(ArticleInteractionService::class);

    foreach ($articles as $article) {
        $service->toggleLike($user, $article);
    }

    expect($user->isFollowingCategory('gaming'))->toBeTrue();
});

test('liking articles across different categories does not follow any of them', function () {
    $user = User::factory()->create();
    $service = app(ArticleInteractionService::class);

    $service->toggleLike($user, NewsArticle::factory()->create(['category' => 'anime']));
    $service->toggleLike($user, NewsArticle::factory()->create(['category' => 'gaming']));
    $service->toggleLike($user, NewsArticle::factory()->create(['category' => 'geek']));

    expect($user->isFollowingCategory('anime'))->toBeFalse()
        ->and($user->isFollowingCategory('gaming'))->toBeFalse()
        ->and($user->isFollowingCategory('geek'))->toBeFalse();
});

test('sharing 2 different articles in the same category follows it', function () {
    $user = User::factory()->create();
    $articles = NewsArticle::factory()->count(2)->create(['category' => 'manga']);
    $service = app(ArticleInteractionService::class);

    foreach ($articles as $article) {
        $service->recordShare($user, $article, 'twitter');
    }

    expect($user->isFollowingCategory('manga'))->toBeTrue();
});

test('sharing a single article does not follow its category yet', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->create(['category' => 'manga']);

    app(ArticleInteractionService::class)->recordShare($user, $article, 'twitter');

    expect($user->isFollowingCategory('manga'))->toBeFalse();
});

test('an anonymous share never follows any category', function () {
    $article = NewsArticle::factory()->create(['category' => 'manga']);

    app(ArticleInteractionService::class)->recordShare(null, $article, 'twitter');
    app(ArticleInteractionService::class)->recordShare(null, $article, 'twitter');
})->throwsNoExceptions();
