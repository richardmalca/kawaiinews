<?php

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

test('invitados son redirigidos al login al intentar ver el centro de notificaciones', function () {
    $response = $this->get(route('public.notifications.index'));

    $response->assertRedirect(route('login'));
});

test('usuario autenticado puede ver la página del centro de notificaciones', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('public.notifications.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('public/notifications/index')
        ->has('notifications')
        ->has('unreadCount')
        ->has('currentFilter')
        ->has('categories')
    );
});

test('usuario puede marcar una notificación individual como leída', function () {
    $user = User::factory()->create();

    $notification = DatabaseNotification::create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\ArticleLikedNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'data' => [
            'type' => 'article_liked',
            'actor_name' => 'Luffy',
            'article_title' => 'One Piece Capítulo 1100',
            'url' => '/noticias/one-piece-1100',
        ],
        'read_at' => null,
    ]);

    $response = $this->actingAs($user)->postJson(route('public.notifications.read', $notification->id));

    $response->assertOk()
        ->assertJson(['success' => true, 'unread_count' => 0]);

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('usuario puede eliminar una notificación', function () {
    $user = User::factory()->create();

    $notification = DatabaseNotification::create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\ArticleLikedNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'data' => [
            'type' => 'article_liked',
            'actor_name' => 'Luffy',
            'article_title' => 'One Piece Capítulo 1100',
            'url' => '/noticias/one-piece-1100',
        ],
        'read_at' => null,
    ]);

    $response = $this->actingAs($user)->deleteJson(route('public.notifications.destroy', $notification->id));

    $response->assertOk()
        ->assertJson(['success' => true]);

    expect(DatabaseNotification::find($notification->id))->toBeNull();
});

test('usuario puede vaciar todo su historial de notificaciones', function () {
    $user = User::factory()->create();

    DatabaseNotification::create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\ArticleLikedNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'data' => ['type' => 'article_liked', 'article_title' => 'Noticia 1'],
    ]);

    DatabaseNotification::create([
        'id' => (string) Str::uuid(),
        'type' => 'App\Notifications\ArticleLikedNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'data' => ['type' => 'article_liked', 'article_title' => 'Noticia 2'],
    ]);

    $response = $this->actingAs($user)->deleteJson(route('public.notifications.destroy_all'));

    $response->assertOk()
        ->assertJson(['success' => true, 'unread_count' => 0]);

    expect($user->notifications()->count())->toBe(0);
});
