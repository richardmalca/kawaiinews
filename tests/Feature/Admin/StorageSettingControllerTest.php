<?php

use App\Models\ActivityLog;
use App\Models\StorageSetting;
use App\Models\User;
use App\Support\RemoteStorage;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('superadmin');
    $this->actingAs($admin);
});

test('the storage settings page renders', function () {
    $response = $this->get(route('admin.storage-settings.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('settings'));
});

test('a superadmin can save the wasabi/s3 credentials, encrypted', function () {
    $response = $this->put(route('admin.storage-settings.update'), [
        'access_key' => 'AKIATEST',
        'secret_key' => 'super-secret',
        'bucket' => 'kawaiinews',
        'region' => 'us-east-1',
        'endpoint' => 'https://s3.wasabisys.com',
        'use_path_style_endpoint' => true,
    ]);

    $response->assertRedirect();

    $settings = StorageSetting::current();
    expect($settings->access_key)->toBe('AKIATEST')
        ->and($settings->secret_key)->toBe('super-secret')
        ->and($settings->bucket)->toBe('kawaiinews');

    // Encriptada de verdad en la base, no en texto plano.
    $raw = DB::table('storage_settings')->first();
    expect($raw->secret_key)->not->toBe('super-secret');

    expect(ActivityLog::where('action', 'storage_settings.updated')->exists())->toBeTrue();
});

test('leaving the secret key blank on update keeps the existing one', function () {
    $settings = StorageSetting::current();
    $settings->update(['access_key' => 'old', 'secret_key' => 'keep-me', 'bucket' => 'b', 'endpoint' => 'https://e.test']);

    $this->put(route('admin.storage-settings.update'), [
        'access_key' => 'new',
        'secret_key' => '',
        'bucket' => 'b',
        'region' => 'us-east-1',
        'endpoint' => 'https://e.test',
        'use_path_style_endpoint' => true,
    ]);

    expect(StorageSetting::current()->secret_key)->toBe('keep-me')
        ->and(StorageSetting::current()->access_key)->toBe('new');
});

test('testing the connection writes, reads and deletes a test file on the configured disk', function () {
    Storage::fake(RemoteStorage::DISK_NAME);

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    $response = $this->postJson(route('admin.storage-settings.test-connection'));

    $response->assertOk()->assertJson(['success' => true]);
    expect(StorageSetting::current()->last_verified_at)->not->toBeNull();
});

test('testing the connection without full credentials fails without touching any disk', function () {
    $response = $this->postJson(route('admin.storage-settings.test-connection'));

    $response->assertOk()->assertJson(['success' => false]);
});

test('media can only be activated once the storage is fully configured', function () {
    $this->post(route('admin.storage-settings.media.toggle'), ['enabled' => true]);

    expect(StorageSetting::current()->active_for_media)->toBeFalse();

    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    $this->post(route('admin.storage-settings.media.toggle'), ['enabled' => true]);

    expect(StorageSetting::current()->active_for_media)->toBeTrue();
});

test('backups can be toggled the same way as media', function () {
    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
    ]);

    $this->post(route('admin.storage-settings.backups.toggle'), ['enabled' => true])->assertRedirect();

    expect(StorageSetting::current()->active_for_backups)->toBeTrue();
    expect(ActivityLog::where('action', 'storage_settings.backups_toggled')->exists())->toBeTrue();
});
