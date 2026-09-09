<?php

use App\Models\Media;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('a media item can be deleted from the library', function () {
    $media = Media::factory()->create();

    $response = $this->deleteJson(route('admin.media.destroy', $media));

    $response->assertOk();
    $this->assertModelMissing($media);
});
