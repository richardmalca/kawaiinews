<?php

use App\Models\AiProvider;
use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use App\Services\Public\CommentModerationService;
use Illuminate\Support\Facades\Http;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

function fakePerspectiveScore(float $score): void
{
    Http::fake([
        'commentanalyzer.googleapis.com/*' => Http::response([
            'attributeScores' => [
                'TOXICITY' => ['summaryScore' => ['value' => $score]],
            ],
        ]),
    ]);
}

test('a clearly toxic comment gets blocked by Perspective alone, without calling the paid ai', function () {
    AiProvider::factory()->create(['provider' => 'perspective', 'api_key' => 'test-key']);
    fakePerspectiveScore(0.97);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'algo toxico']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('blocked');
});

test('a clearly clean comment gets approved by Perspective alone, without calling the paid ai', function () {
    AiProvider::factory()->create(['provider' => 'perspective', 'api_key' => 'test-key']);
    fakePerspectiveScore(0.02);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'que buen capitulo']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('visible');
});

test('an ambiguous score falls through to the paid ai layer', function () {
    AiProvider::factory()->create(['provider' => 'perspective', 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active_for_moderation' => true, 'api_key' => 'test-key']);
    fakePerspectiveScore(0.5);

    Prism::fake([
        TextResponseFake::make()->withText('OK'),
    ]);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'un comentario dudoso']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('visible');
});

test('when Perspective fails it falls through to the paid ai layer instead of breaking', function () {
    AiProvider::factory()->create(['provider' => 'perspective', 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active_for_moderation' => true, 'api_key' => 'test-key']);

    Http::fake([
        'commentanalyzer.googleapis.com/*' => Http::response(['error' => 'boom'], 500),
    ]);

    Prism::fake([
        TextResponseFake::make()->withText('OK'),
    ]);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'un comentario']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('visible');
});
