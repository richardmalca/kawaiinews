<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
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
    public function updateUser(User $actingUser, User $user, array $data): User
    {
        $this->assertCanManage($actingUser, $user);

        if ($data['role'] === 'superadmin' && ! $actingUser->hasRole('superadmin')) {
            throw new AuthorizationException('No podés asignar el rol superadmin.');
        }

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        $user->syncRoles([$data['role']]);

        return $user;
    }

    public function deleteUser(User $actingUser, User $user): void
    {
        $this->assertCanManage($actingUser, $user);

        $user->delete();
    }

    private function assertCanManage(User $actingUser, User $user): void
    {
        if ($actingUser->is($user)) {
            throw new AuthorizationException('No podés editar ni eliminar tu propia cuenta desde este panel.');
        }

        if ($user->hasRole('superadmin') && ! $actingUser->hasRole('superadmin')) {
            throw new AuthorizationException('Solo un superadmin puede editar o eliminar a otro superadmin.');
        }
    }
}
