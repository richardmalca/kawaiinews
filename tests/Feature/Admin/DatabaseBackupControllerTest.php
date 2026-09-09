<?php

use App\Models\User;
use App\Services\Admin\DatabaseBackupService;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
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
