<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function makeStaff(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('an admin cannot delete a superadmin', function () {
    $admin = makeStaff('admin');
    $superadmin = makeStaff('superadmin');

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $superadmin))
        ->assertForbidden();

    expect($superadmin->fresh())->not->toBeNull();
});

test('an admin cannot demote a superadmin to a lower role', function () {
    $admin = makeStaff('admin');
    $superadmin = makeStaff('superadmin');

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $superadmin), [
            'name' => $superadmin->name,
            'email' => $superadmin->email,
            'role' => 'editor',
        ])
        ->assertForbidden();

    expect($superadmin->fresh()->hasRole('superadmin'))->toBeTrue();
});

test('an admin cannot promote another user to superadmin', function () {
    $admin = makeStaff('admin');
    $editor = makeStaff('editor');

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $editor), [
            'name' => $editor->name,
            'email' => $editor->email,
            'role' => 'superadmin',
        ])
        ->assertInvalid('role');

    expect($editor->fresh()->hasRole('superadmin'))->toBeFalse();
});

test('a superadmin can manage another superadmin', function () {
    $actingSuperadmin = makeStaff('superadmin');
    $otherSuperadmin = makeStaff('superadmin');

    $this->actingAs($actingSuperadmin)
        ->patch(route('admin.users.update', $otherSuperadmin), [
            'name' => 'Renombrado',
            'email' => $otherSuperadmin->email,
            'role' => 'admin',
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($otherSuperadmin->fresh())
        ->name->toBe('Renombrado')
        ->hasRole('admin')->toBeTrue();
});

test('a user cannot edit or delete their own account from the admin panel', function () {
    $superadmin = makeStaff('superadmin');

    $this->actingAs($superadmin)
        ->patch(route('admin.users.update', $superadmin), [
            'name' => 'Autoedición',
            'email' => $superadmin->email,
            'role' => 'superadmin',
        ])
        ->assertForbidden();

    $this->actingAs($superadmin)
        ->delete(route('admin.users.destroy', $superadmin))
        ->assertForbidden();

    expect($superadmin->fresh())->not->toBeNull();
});

test('an admin can still manage a lower ranked editor', function () {
    $admin = makeStaff('admin');
    $editor = makeStaff('editor');

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $editor), [
            'name' => 'Editado por admin',
            'email' => $editor->email,
            'role' => 'editor',
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($editor->fresh()->name)->toBe('Editado por admin');

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $editor))
        ->assertRedirect(route('admin.users.index'));

    expect($editor->fresh())->toBeNull();
});
