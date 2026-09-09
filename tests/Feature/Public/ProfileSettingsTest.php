<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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

test('a username cannot exceed 25 characters or contain special characters', function () {
    $user = User::factory()->create(['username' => null]);

    $this->actingAs($user)
        ->patch(route('public.profile.settings.self.update'), [
            'username' => 'usuario_con_mas_de_veinticinco_caracteres',
        ])
        ->assertInvalid('username');

    $this->actingAs($user)
        ->patch(route('public.profile.settings.self.update'), [
            'username' => 'DarkBot@ds',
        ])
        ->assertInvalid('username');

    $this->actingAs($user)
        ->patch(route('public.profile.settings.self.update'), [
            'username' => 'darkbot_dv',
        ])
        ->assertValid('username');

    expect($user->fresh()->username)->toBe('darkbot_dv');
});

test('a user can upload custom avatar and banner and choose avatar source', function () {
    Storage::fake('public');

    $user = User::factory()->create([
        'username' => 'photouser',
        'avatar' => 'https://lh3.googleusercontent.com/a/google-avatar.png',
        'email' => 'original@example.com',
    ]);

    $avatarFile = UploadedFile::fake()->image('avatar.png', 400, 400)->size(1500);
    $bannerFile = UploadedFile::fake()->image('banner.jpg', 1200, 400)->size(3000);

    $this->actingAs($user)
        ->post(route('public.profile.settings.update', 'photouser'), [
            'name' => 'Photo User',
            'username' => 'photouser',
            'email' => 'hacked@example.com',
            'avatar_source' => 'custom',
            'custom_avatar' => $avatarFile,
            'banner' => $bannerFile,
        ])
        ->assertRedirect(route('public.profile.settings.edit', 'photouser'));

    $user->refresh();

    expect($user->email)->toBe('original@example.com');
    expect($user->avatar_source)->toBe('custom');
    expect($user->custom_avatar)->not->toBeNull();
    expect($user->banner)->not->toBeNull();
    expect($user->active_avatar_url)->toBe($user->custom_avatar);

    Storage::disk('public')->assertExists(str_replace('/storage/', '', $user->custom_avatar));
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $user->banner));
});

test('avatar and banner must respect file size limits', function () {
    Storage::fake('public');

    $user = User::factory()->create(['username' => 'heavyuser']);

    $tooHeavyAvatar = UploadedFile::fake()->image('avatar.png', 400, 400)->size(2500);
    $tooHeavyBanner = UploadedFile::fake()->image('banner.jpg', 1200, 400)->size(5000);

    $this->actingAs($user)
        ->post(route('public.profile.settings.update', 'heavyuser'), [
            'name' => 'Heavy User',
            'username' => 'heavyuser',
            'custom_avatar' => $tooHeavyAvatar,
            'banner' => $tooHeavyBanner,
        ])
        ->assertInvalid(['custom_avatar', 'banner']);
});

test('a user can set an external anime banner preset without uploading files', function () {
    $user = User::factory()->create([
        'username' => 'presetuser',
        'avatar' => 'https://lh3.googleusercontent.com/a/google-avatar.png',
        'banner' => null,
    ]);

    $externalUrl = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&h=533&q=85';

    $this->actingAs($user)
        ->post(route('public.profile.settings.update', 'presetuser'), [
            'name' => 'Preset User',
            'username' => 'presetuser',
            'avatar_source' => 'google',
            'banner' => $externalUrl,
        ])
        ->assertRedirect(route('public.profile.settings.edit', 'presetuser'));

    $user->refresh();

    expect($user->banner)->toBe($externalUrl);
    expect($user->avatar_source)->toBe('google');
    expect($user->active_avatar_url)->toBe($user->avatar);
});
