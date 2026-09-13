<?php

use App\Models\ActivityLog;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('superadmin');
    $this->actingAs($admin);
});

test('the site settings page renders the current settings', function () {
    $response = $this->get(route('admin.site-settings.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('settings.name')
        ->has('settings.canonical_url')
    );
});

test('a superadmin can update the site name, description and keywords', function () {
    $response = $this->put(route('admin.site-settings.update'), [
        'name' => 'Mi Portal Otaku',
        'description' => 'Las últimas noticias de anime',
        'keywords' => ['anime', 'manga', 'gaming'],
    ]);

    $response->assertRedirect();

    $settings = SiteSetting::current();
    expect($settings->name)->toBe('Mi Portal Otaku')
        ->and($settings->description)->toBe('Las últimas noticias de anime')
        ->and($settings->keywords)->toBe(['anime', 'manga', 'gaming']);

    expect(ActivityLog::where('action', 'site_settings.updated')->exists())->toBeTrue();
});

test('uploading a logo stores it and exposes its url', function () {
    $file = UploadedFile::fake()->image('logo.png', 400, 400);

    $this->post(route('admin.site-settings.logo.update'), ['logo' => $file])
        ->assertRedirect();

    $settings = SiteSetting::current();
    expect($settings->logo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($settings->logo_path);
});

test('removing the logo deletes the file and clears the path', function () {
    $file = UploadedFile::fake()->image('logo.png', 400, 400);
    $this->post(route('admin.site-settings.logo.update'), ['logo' => $file]);
    $path = SiteSetting::current()->logo_path;

    $this->delete(route('admin.site-settings.logo.destroy'))->assertRedirect();

    Storage::disk('public')->assertMissing($path);
    expect(SiteSetting::current()->logo_path)->toBeNull();
});

test('uploading a favicon generates the 32, 192 and apple-touch-icon sizes', function () {
    $file = UploadedFile::fake()->image('icon.png', 512, 512);

    $this->post(route('admin.site-settings.favicon.update'), ['favicon' => $file])
        ->assertRedirect();

    $settings = SiteSetting::current();
    expect($settings->favicon_path)->not->toBeNull()
        ->and($settings->favicon_192_path)->not->toBeNull()
        ->and($settings->apple_touch_icon_path)->not->toBeNull();

    Storage::disk('public')->assertExists($settings->favicon_path);
    Storage::disk('public')->assertExists($settings->favicon_192_path);
    Storage::disk('public')->assertExists($settings->apple_touch_icon_path);

    // Verifica que de verdad haya reducido el tamaño, no que solo copió el
    // archivo original con otro nombre.
    $contents = Storage::disk('public')->get($settings->favicon_path);
    $image = imagecreatefromstring($contents);
    expect(imagesx($image))->toBe(32)
        ->and(imagesy($image))->toBe(32);
});

test('uploading a non-square favicon still produces square outputs (center-cropped)', function () {
    $file = UploadedFile::fake()->image('wide.png', 800, 400);

    $this->post(route('admin.site-settings.favicon.update'), ['favicon' => $file])
        ->assertRedirect();

    $contents = Storage::disk('public')->get(SiteSetting::current()->favicon_path);
    $image = imagecreatefromstring($contents);
    expect(imagesx($image))->toBe(32)
        ->and(imagesy($image))->toBe(32);
});

test('uploading an og image crops it to 1200x630', function () {
    $file = UploadedFile::fake()->image('banner.jpg', 2000, 1000);

    $this->post(route('admin.site-settings.og-image.update'), ['og_image' => $file])
        ->assertRedirect();

    $settings = SiteSetting::current();
    expect($settings->og_image_path)->not->toBeNull();

    $contents = Storage::disk('public')->get($settings->og_image_path);
    $image = imagecreatefromstring($contents);
    expect(imagesx($image))->toBe(1200)
        ->and(imagesy($image))->toBe(630);
});

test('a non-superadmin cannot reach the site settings page', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');

    $this->actingAs($editor)
        ->get(route('admin.site-settings.edit'))
        ->assertForbidden();
});
