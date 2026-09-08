<?php

namespace App\Services;

use App\Models\User;

class AuthRedirectService
{
    /**
     * @var array<int, string>
     */
    private const PRIVILEGED_ROLES = ['superadmin', 'admin', 'editor'];

    public function redirectPathFor(User $user): string
    {
        return $user->hasAnyRole(self::PRIVILEGED_ROLES) ? '/admin' : '/';
    }
}
