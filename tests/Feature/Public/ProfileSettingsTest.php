<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('a public reader without staff role cannot reach the admin settings panel', function () {
    $reader = User::factory()->create(['username' => 'lector1']);

    $this->actingAs($reader)->get('/settings/profile')->assertForbidden();
    $this->actingAs($reader)->get('/settings')->assertForbidden();
});

test('an editor can still reach the admin settings panel', function () {
    $editor = User::factory()->create(['username' => 'editor1']);
    $editor->assignRole('editor');

    $this->actingAs($editor)->get('/settings/profile')->assertOk();
});

test('a user without a chosen username is redirected to pick one', function () {
    // No se valida el componente Inertia puntual (`public/profile/settings/
    // choose-username`) porque esa página la construye la sesión de
    // frontend público; acá solo importa que NO redirija a una URL con
    // username y responda 200 en vez de fallar.
    $user = User::factory()->create(['username' => null]);

    $this->actingAs($user)
        ->get(route('public.profile.settings.self'))
        ->assertOk();
});

test('a user with a username is redirected to their own settings page', function () {
    $user = User::factory()->create(['username' => 'kawaiifan']);

    $this->actingAs($user)
        ->get(route('public.profile.settings.self'))
        ->assertRedirect(route('public.profile.settings.edit', 'kawaiifan'));
});

test('a user can view and update their own public profile settings', function () {
    $user = User::factory()->create(['username' => 'kawaiifan', 'show_shares_on_profile' => false]);

    $this->actingAs($user)
        ->get(route('public.profile.settings.edit', 'kawaiifan'))
        ->assertOk();

    $this->actingAs($user)
        ->patch(route('public.profile.settings.update', 'kawaiifan'), [
            'name' => 'Kawaii Fan',
            'username' => 'kawaiifan2',
            'email' => $user->email,
            'show_shares_on_profile' => true,
        ])
        ->assertRedirect(route('public.profile.settings.edit', 'kawaiifan2'));

    expect($user->fresh())
        ->username->toBe('kawaiifan2')
        ->show_shares_on_profile->toBeTrue();
});

test('a user cannot view or update someone elses public profile settings', function () {
    $user = User::factory()->create(['username' => 'usuario-a']);
    $other = User::factory()->create(['username' => 'usuario-b']);

    $this->actingAs($user)
        ->get(route('public.profile.settings.edit', 'usuario-b'))
        ->assertForbidden();

    $this->actingAs($user)
        ->patch(route('public.profile.settings.update', 'usuario-b'), [
            'name' => 'Hackeo',
            'username' => 'usuario-b',
            'email' => $other->email,
        ])
        ->assertForbidden();

    expect($other->fresh()->name)->not->toBe('Hackeo');
});

test('a username cannot collide with a reserved route segment', function () {
    $user = User::factory()->create(['username' => 'kawaiifan']);

    $this->actingAs($user)
        ->patch(route('public.profile.settings.update', 'kawaiifan'), [
            'name' => $user->name,
            'username' => 'mi-cuenta',
            'email' => $user->email,
        ])
        ->assertInvalid('username');
});
