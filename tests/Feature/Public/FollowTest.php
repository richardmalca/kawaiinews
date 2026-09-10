<?php

use App\Models\Tag;
use App\Models\User;
use App\Notifications\UserFollowedNotification;
use Illuminate\Support\Facades\Notification;

test('a user can follow and unfollow another user and trigger notification', function () {
    Notification::fake();

    $user = User::factory()->create();
    $targetUser = User::factory()->create(['username' => 'otakusenpai']);

    $response = $this->actingAs($user)
        ->postJson(route('public.profile.follow', $targetUser->username));

    $response->assertOk()
        ->assertJson([
            'following' => true,
            'followers_count' => 1,
        ]);

    expect($user->isFollowing($targetUser))->toBeTrue();
    Notification::assertSentTo($targetUser, UserFollowedNotification::class);

    // Unfollow
    $response2 = $this->actingAs($user)
        ->postJson(route('public.profile.follow', $targetUser->username));

    $response2->assertOk()
        ->assertJson([
            'following' => false,
            'followers_count' => 0,
        ]);

    expect($user->isFollowing($targetUser))->toBeFalse();
});

test('a user cannot follow themselves', function () {
    $user = User::factory()->create(['username' => 'selfuser']);

    $this->actingAs($user)
        ->postJson(route('public.profile.follow', $user->username))
        ->assertUnprocessable();
});

test('a user can follow and unfollow a tag', function () {
    $user = User::factory()->create();
    $tag = Tag::create(['name' => 'Re:Zero', 'slug' => 'rezero']);

    $response = $this->actingAs($user)
        ->postJson(route('public.tag.follow', $tag->slug));

    $response->assertOk()
        ->assertJson([
            'following' => true,
            'followers_count' => 1,
        ]);

    expect($user->isFollowing($tag))->toBeTrue();

    // Toggle unfollow
    $response2 = $this->actingAs($user)
        ->postJson(route('public.tag.follow', $tag->slug));

    $response2->assertOk()
        ->assertJson([
            'following' => false,
            'followers_count' => 0,
        ]);

    expect($user->isFollowing($tag))->toBeFalse();
});

test('a user can follow and unfollow a category', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('public.category.follow', 'anime'));

    $response->assertOk()
        ->assertJson([
            'following' => true,
            'followers_count' => 1,
        ]);

    expect($user->isFollowingCategory('anime'))->toBeTrue();

    // Toggle unfollow
    $response2 = $this->actingAs($user)
        ->postJson(route('public.category.follow', 'anime'));

    $response2->assertOk()
        ->assertJson([
            'following' => false,
            'followers_count' => 0,
        ]);

    expect($user->isFollowingCategory('anime'))->toBeFalse();
});
