<?php

use App\Models\NewsArticle;
use App\Models\Share;
use App\Models\User;

test('a logged in user can follow and unfollow another user', function () {
    $user = User::factory()->create();
    $author = User::factory()->create();

    $this->actingAs($user)
        ->post(route('public.profile.follow', $author->username))
        ->assertOk()
        ->assertJson(['following' => true, 'followers_count' => 1]);

    expect($user->fresh()->isFollowing($author))->toBeTrue();

    $this->actingAs($user)
        ->post(route('public.profile.follow', $author->username))
        ->assertOk()
        ->assertJson(['following' => false, 'followers_count' => 0]);
});

test('a user cannot follow themselves', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('public.profile.follow', $user->username))
        ->assertInvalid('username');
});

test('a logged in user can like and unlike a published article', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->post(route('public.articles.like', $article->slug))
        ->assertOk()
        ->assertJson(['liked' => true, 'total_likers' => 1]);

    $this->actingAs($user)
        ->post(route('public.articles.like', $article->slug))
        ->assertOk()
        ->assertJson(['liked' => false, 'total_likers' => 0]);
});

test('a logged in user can favorite and unfavorite a published article', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->post(route('public.articles.favorite', $article->slug))
        ->assertOk()
        ->assertJson(['favorited' => true]);

    $this->actingAs($user)
        ->post(route('public.articles.favorite', $article->slug))
        ->assertOk()
        ->assertJson(['favorited' => false]);
});

test('sharing an article works both logged in and as a guest', function () {
    $article = NewsArticle::factory()->published()->create();

    $this->post(route('public.articles.share', $article->slug), ['channel' => 'whatsapp'])
        ->assertOk()
        ->assertJson(['shared' => true]);

    expect(Share::where('news_article_id', $article->id)->where('channel', 'whatsapp')->whereNull('user_id')->exists())
        ->toBeTrue();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('public.articles.share', $article->slug), ['channel' => 'link'])
        ->assertOk();

    expect(Share::where('news_article_id', $article->id)->where('user_id', $user->id)->exists())->toBeTrue();
});

test('sharing the same article twice does not duplicate it in the user profile (regression: shares were never unified)', function () {
    $user = User::factory()->create(['show_shares_on_profile' => true]);
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->post(route('public.articles.share', $article->slug), ['channel' => 'whatsapp'])
        ->assertOk();

    $this->actingAs($user)
        ->post(route('public.articles.share', $article->slug), ['channel' => 'link'])
        ->assertOk();

    expect(Share::where('user_id', $user->id)->where('news_article_id', $article->id)->count())->toBe(1)
        ->and(Share::where('user_id', $user->id)->where('news_article_id', $article->id)->first()->channel)->toBe('link');

    $this->get(route('public.profile.show', $user->username))
        ->assertInertia(fn ($page) => $page->has('profile.shares', 1));
});

test('two different guests sharing the same article are both counted (no user to unify by)', function () {
    $article = NewsArticle::factory()->published()->create();

    $this->post(route('public.articles.share', $article->slug), ['channel' => 'whatsapp'])->assertOk();
    $this->post(route('public.articles.share', $article->slug), ['channel' => 'link'])->assertOk();

    expect(Share::where('news_article_id', $article->id)->whereNull('user_id')->count())->toBe(2);
});

test('a public profile only shows shares when the user opted in', function () {
    $author = User::factory()->create(['show_shares_on_profile' => false]);
    $article = NewsArticle::factory()->published()->create();
    Share::factory()->create(['user_id' => $author->id, 'news_article_id' => $article->id]);

    $this->get(route('public.profile.show', $author->username))
        ->assertInertia(fn ($page) => $page
            ->where('profile.shares_visible', false)
            ->where('profile.shares', [])
        );

    $author->update(['show_shares_on_profile' => true]);

    $this->get(route('public.profile.show', $author->username))
        ->assertInertia(fn ($page) => $page
            ->where('profile.shares_visible', true)
            ->has('profile.shares', 1)
        );
});
