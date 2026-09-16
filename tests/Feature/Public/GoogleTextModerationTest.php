<?php

use App\Models\AiProvider;
use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use App\Services\Public\CommentModerationService;
use Illuminate\Support\Facades\Http;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

function fakeModerationScore(float $toxicScore): void
{
    Http::fake([
        'language.googleapis.com/*' => Http::response([
            'moderationCategories' => [
                ['name' => 'Toxic', 'confidence' => $toxicScore],
                ['name' => 'Insult', 'confidence' => $toxicScore],
                ['name' => 'Finance', 'confidence' => 0.9],
            ],
        ]),
    ]);
}

test('a clearly toxic comment gets blocked by Google moderation alone, without calling the paid ai', function () {
    AiProvider::factory()->create(['provider' => 'google-moderation', 'api_key' => 'test-key']);
    fakeModerationScore(0.97);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'algo toxico']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('blocked');
});

test('a clearly clean comment gets approved by Google moderation alone, without calling the paid ai', function () {
    AiProvider::factory()->create(['provider' => 'google-moderation', 'api_key' => 'test-key']);
    fakeModerationScore(0.02);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'que buen capitulo']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('visible');
});

test('a high score in an unrelated category like Finance does not trigger a block', function () {
    AiProvider::factory()->create(['provider' => 'google-moderation', 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active_for_moderation' => true, 'api_key' => 'test-key']);

    // Toxic/Insult bajos, pero Finance alto — no debería bloquear por eso.
    Http::fake([
        'language.googleapis.com/*' => Http::response([
            'moderationCategories' => [
                ['name' => 'Toxic', 'confidence' => 0.05],
                ['name' => 'Insult', 'confidence' => 0.05],
                ['name' => 'Finance', 'confidence' => 0.95],
            ],
        ]),
    ]);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'hablando de dinero']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('visible');
});

test('an ambiguous score falls through to the paid ai layer', function () {
    AiProvider::factory()->create(['provider' => 'google-moderation', 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active_for_moderation' => true, 'api_key' => 'test-key']);
    fakeModerationScore(0.5);

    Prism::fake([
        TextResponseFake::make()->withText('OK'),
    ]);

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['user_id' => $user->id, 'news_article_id' => $article->id, 'status' => 'pending', 'body' => 'un comentario dudoso']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('visible');
});

test('when Google moderation fails it falls through to the paid ai layer instead of breaking', function () {
    AiProvider::factory()->create(['provider' => 'google-moderation', 'api_key' => 'test-key']);
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active_for_moderation' => true, 'api_key' => 'test-key']);

    Http::fake([
        'language.googleapis.com/*' => Http::response(['error' => 'boom'], 500),
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
