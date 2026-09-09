<?php

use App\Models\User;
use App\Services\Auth\GoogleAuthService;
use Laravel\Socialite\Two\User as SocialiteUser;

function fakeGoogleUser(string $id, string $email, string $name = 'Test User', string $avatar = 'https://example.test/avatar.png'): SocialiteUser
{
    $googleUser = new SocialiteUser;
    $googleUser->id = $id;
    $googleUser->email = $email;
    $googleUser->name = $name;
    $googleUser->avatar = $avatar;

    return $googleUser;
}

test('a new google login creates a user with the google_id persisted', function () {
    $user = app(GoogleAuthService::class)->findOrCreateUser(
        fakeGoogleUser('111222333', 'nuevo@example.com')
    );

    expect($user->google_id)->toBe('111222333')
        ->and($user->fresh()->google_id)->toBe('111222333');
});

test('logging in again with google actually persists the google_id on an existing user (regression: google_id was missing from Fillable)', function () {
    $user = User::factory()->create(['email' => 'ya-existe@example.com', 'google_id' => null]);

    app(GoogleAuthService::class)->findOrCreateUser(
        fakeGoogleUser('444555666', 'ya-existe@example.com')
    );

    expect($user->fresh()->google_id)->toBe('444555666');
});

test('a returning google user is matched by google_id and updates their avatar', function () {
    $user = User::factory()->create(['google_id' => '789', 'avatar' => null]);

    $found = app(GoogleAuthService::class)->findOrCreateUser(
        fakeGoogleUser('789', 'otro-email-en-google@example.com', avatar: 'https://example.test/nuevo-avatar.png')
    );

    expect($found->id)->toBe($user->id)
        ->and($found->fresh()->avatar)->toBe('https://example.test/nuevo-avatar.png');
});
