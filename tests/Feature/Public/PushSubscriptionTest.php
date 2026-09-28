<?php

use App\Models\PushSubscription;

test('a visitor can subscribe to push notifications without being authenticated', function () {
    $this->postJson('/api/push/subscribe', [
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
        'keys' => [
            'p256dh' => 'test-public-key',
            'auth' => 'test-auth-token',
        ],
    ])->assertOk()->assertJsonPath('subscribed', true);

    expect(PushSubscription::count())->toBe(1);
});

test('subscribing twice with the same endpoint updates the existing row instead of duplicating it', function () {
    $endpoint = 'https://fcm.googleapis.com/fcm/send/abc123';

    $payload = fn (string $auth) => [
        'endpoint' => $endpoint,
        'keys' => ['p256dh' => 'test-public-key', 'auth' => $auth],
    ];

    $this->postJson('/api/push/subscribe', $payload('first-auth'))->assertOk();
    $this->postJson('/api/push/subscribe', $payload('second-auth'))->assertOk();

    expect(PushSubscription::count())->toBe(1);
    expect(PushSubscription::first()->auth_token)->toBe('second-auth');
});

test('a visitor can unsubscribe', function () {
    $endpoint = 'https://fcm.googleapis.com/fcm/send/abc123';

    PushSubscription::create([
        'endpoint' => $endpoint,
        'endpoint_hash' => hash('sha256', $endpoint),
        'public_key' => 'test-public-key',
        'auth_token' => 'test-auth-token',
    ]);

    $this->postJson('/api/push/unsubscribe', ['endpoint' => $endpoint])
        ->assertOk()
        ->assertJsonPath('subscribed', false);

    expect(PushSubscription::count())->toBe(0);
});
