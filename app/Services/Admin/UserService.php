<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserService
{
    /**
     * Recibe la misma colección de usuarios que ya cargó el controller para
     * la tabla (con roles y published_articles_count precargados vía
     * withCount) — evita una segunda consulta idéntica solo para los KPIs.
     *
     * @param  Collection<int, User>  $users
     * @return array{total: int, by_role: array<string, int>, google_accounts: int, password_accounts: int, published_articles: int}
     */
    public function kpisFrom(Collection $users): array
    {
        $byRole = $users
            ->flatMap(fn (User $user) => $user->roles->pluck('name'))
            ->countBy()
            ->all();

        // "verificado" no sirve como métrica acá: tanto crear un usuario
        // desde el panel (UserService::createUser) como loguearse con
        // Google (GoogleAuthService) marcan email_verified_at
        // automáticamente — siempre daría 100%. Lo que sí varía de verdad
        // es el método de login, así que se muestra eso.
        $googleAccounts = $users->whereNotNull('google_id')->count();

        return [
            'total' => $users->count(),
            'by_role' => [
                'superadmin' => $byRole['superadmin'] ?? 0,
                'admin' => $byRole['admin'] ?? 0,
                'editor' => $byRole['editor'] ?? 0,
            ],
            'google_accounts' => $googleAccounts,
            'password_accounts' => $users->count() - $googleAccounts,
            'published_articles' => (int) $users->sum('published_articles_count'),
        ];
    }

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
