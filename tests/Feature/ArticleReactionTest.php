<?php

use App\Models\ArticleReaction;
use App\Models\NewsArticle;
use App\Models\User;

test('a guest cannot react to an article', function () {
    $article = NewsArticle::factory()->published()->create();

    $this->postJson(route('public.articles.react', $article->slug), ['reaction' => 'fire'])
        ->assertUnauthorized();
});

test('a logged in user can react to an article', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $response = $this->actingAs($user)
        ->postJson(route('public.articles.react', $article->slug), ['reaction' => 'fire']);

    $response->assertOk()
        ->assertJsonPath('reaction', 'fire')
        ->assertJsonPath('reactions.fire', 1);

    expect(ArticleReaction::where('user_id', $user->id)->where('news_article_id', $article->id)->value('reaction'))
        ->toBe('fire');
});

test('toggling the same reaction removes it', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.articles.react', $article->slug), ['reaction' => 'heart'])
        ->assertOk()
        ->assertJsonPath('reaction', 'heart')
        ->assertJsonPath('reactions.heart', 1);

    $this->actingAs($user)
        ->postJson(route('public.articles.react', $article->slug), ['reaction' => 'heart'])
        ->assertOk()
        ->assertJsonPath('reaction', null)
        ->assertJsonPath('reactions.heart', 0);

    expect(ArticleReaction::where('user_id', $user->id)->where('news_article_id', $article->id)->exists())
        ->toBeFalse();
});

test('switching reaction updates to the new reaction', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.articles.react', $article->slug), ['reaction' => 'shock'])
        ->assertOk()
        ->assertJsonPath('reaction', 'shock');

    $this->actingAs($user)
        ->postJson(route('public.articles.react', $article->slug), ['reaction' => 'think'])
        ->assertOk()
        ->assertJsonPath('reaction', 'think')
        ->assertJsonPath('reactions.shock', 0)
        ->assertJsonPath('reactions.think', 1);

    expect(ArticleReaction::where('user_id', $user->id)->where('news_article_id', $article->id)->value('reaction'))
        ->toBe('think');
});
