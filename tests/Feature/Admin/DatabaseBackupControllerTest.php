<?php

use App\Models\StorageSetting;
use App\Models\User;
use App\Services\Admin\DatabaseBackupService;
use App\Support\RemoteStorage;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function actingAsSuperadminForBackups(): User
{
    $user = User::factory()->create();
    $user->assignRole('superadmin');
    test()->actingAs($user);

    return $user;
}

function configureRemoteStorageForBackups(): void
{
    StorageSetting::current()->update([
        'access_key' => 'a', 'secret_key' => 's', 'bucket' => 'b', 'endpoint' => 'https://e.test',
        'active_for_backups' => true,
    ]);
}

test('downloading a backup also uploads a copy to the remote disk when backups are active there', function () {
    Storage::fake(RemoteStorage::DISK_NAME);
    actingAsSuperadminForBackups();
    configureRemoteStorageForBackups();
    $this->partialMock(DatabaseBackupService::class, function ($mock) {
        $mock->shouldReceive('exportCompressed')->andReturn(gzencode('fake sql'));
    });

    $this->get(route('admin.backup.download'))->assertOk();

    Storage::disk(RemoteStorage::DISK_NAME)->assertExists(
        collect(Storage::disk(RemoteStorage::DISK_NAME)->files('backups'))->first()
    );
});

test('downloading a backup does not upload anywhere when remote backups are not active', function () {
    Storage::fake(RemoteStorage::DISK_NAME);
    actingAsSuperadminForBackups();
    $this->partialMock(DatabaseBackupService::class, function ($mock) {
        $mock->shouldReceive('exportCompressed')->andReturn(gzencode('fake sql'));
    });

    $this->get(route('admin.backup.download'))->assertOk();

    expect(Storage::disk(RemoteStorage::DISK_NAME)->files('backups'))->toBeEmpty();
});

test('backup now uploads directly to the remote disk without a browser download', function () {
    Storage::fake(RemoteStorage::DISK_NAME);
    actingAsSuperadminForBackups();
    configureRemoteStorageForBackups();
    $this->partialMock(DatabaseBackupService::class, function ($mock) {
        $mock->shouldReceive('exportCompressed')->andReturn(gzencode('fake sql'));
    });

    $this->post(route('admin.backup.remote.store'))->assertRedirect();

    expect(Storage::disk(RemoteStorage::DISK_NAME)->files('backups'))->not->toBeEmpty();
});

test('backup now refuses if remote backups are not active', function () {
    actingAsSuperadminForBackups();

    $this->post(route('admin.backup.remote.store'))->assertRedirect();

    expect(StorageSetting::current()->active_for_backups)->toBeFalse();
});

test('remote backups can be listed, downloaded and deleted', function () {
    Storage::fake(RemoteStorage::DISK_NAME);
    actingAsSuperadminForBackups();
    configureRemoteStorageForBackups();

    Storage::disk(RemoteStorage::DISK_NAME)->put('backups/test-backup.sql.gz', 'contenido');

    $this->getJson(route('admin.backup.remote.index'))
        ->assertOk()
        ->assertJsonPath('backups.0.name', 'test-backup.sql.gz');

    $this->get(route('admin.backup.remote.download', 'test-backup.sql.gz'))
        ->assertOk()
        ->assertSee('contenido');

    $this->delete(route('admin.backup.remote.destroy', 'test-backup.sql.gz'))->assertRedirect();

    Storage::disk(RemoteStorage::DISK_NAME)->assertMissing('backups/test-backup.sql.gz');
});

test('a superadmin can download a backup', function () {
    $user = User::factory()->create();
    $user->assignRole('superadmin');

    $this->mock(DatabaseBackupService::class, function ($mock) {
        $mock->shouldReceive('exportCompressed')->once()->andReturn(gzencode('fake sql'));
    });

    $response = $this->actingAs($user)->get(route('admin.backup.download'));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toBe('application/gzip');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
});

test('a non superadmin cannot download a backup', function () {
    $user = User::factory()->create();
    $user->assignRole('editor');

    $this->actingAs($user)
        ->get(route('admin.backup.download'))
        ->assertForbidden();
});

test('restoring a backup requires typing the exact same email as the logged in user, working for google-only accounts without a real password', function () {
    $user = User::factory()->create(['email' => 'superadmin@example.com']);
    $user->assignRole('superadmin');

    $this->mock(DatabaseBackupService::class, function ($mock) {
        $mock->shouldNotReceive('importCompressed');
    });

    $response = $this->actingAs($user)
        ->from(route('admin.backup.index'))
        ->post(route('admin.backup.restore'), [
            'backup' => UploadedFile::fake()->createWithContent('backup.sql.gz', gzencode('fake sql')),
            'confirm_email' => 'otro@example.com',
        ]);

    $response->assertSessionHasErrors('confirm_email');
});

test('a superadmin can restore a backup by typing their own email, with no password involved at all', function () {
    $user = User::factory()->create(['email' => 'superadmin@example.com']);
    $user->assignRole('superadmin');

    $this->mock(DatabaseBackupService::class, function ($mock) {
        $mock->shouldReceive('importCompressed')->once();
    });

    $response = $this->actingAs($user)->post(route('admin.backup.restore'), [
        'backup' => UploadedFile::fake()->createWithContent('backup.sql.gz', gzencode('fake sql')),
        'confirm_email' => 'superadmin@example.com',
    ]);

    $response->assertRedirect(route('admin.backup.index'));
});
