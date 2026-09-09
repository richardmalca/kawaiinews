<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserService
{
    /**
     * @return array<int, string>
     */
    public function assignableRoles(User $actingUser): array
    {
        $roles = Role::pluck('name');

        if (! $actingUser->hasRole('superadmin')) {
            $roles = $roles->reject(fn (string $role) => $role === 'superadmin');
        }

        return $roles->values()->all();
    }

    /**
     * @param  array{name: string, email: string, password: string, role: string}  $data
     */
    public function createUser(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($data['role']);

        return $user;
    }

    /**
     * @param  array{name: string, email: string, role: string}  $data
     */
    public function updateUser(User $user, array $data): User
    {
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        $user->syncRoles([$data['role']]);

        return $user;
    }

    public function deleteUser(User $user): void
    {
        $user->delete();
    }
}
