<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\UserFollowedNotification;
use App\Services\Public\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService
    ) {}

    /**
     * Búsqueda instantánea de usuarios por nombre o username, para el buscador
     * del frontend (antes devolvía perfiles de mentira hardcodeados ahí — esto
     * lo reemplaza con datos reales). Solo usuarios con username elegido:
     * sin uno no tienen una URL de perfil a la que enlazar.
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['profiles' => []]);
        }

        $users = User::query()
            ->whereNotNull('username')
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('username', 'like', "%{$q}%");
            })
            ->withCount('followers')
            ->limit(8)
            ->get();

        return response()->json([
            'profiles' => $users->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->active_avatar_url,
                'badge' => $user->community_badge,
                'followers_count' => $user->followers_count,
            ])->values(),
        ]);
    }

    public function show(Request $request, string $username): JsonResponse
    {
        $viewer = $request->user('sanctum');
        $profileUser = $this->profileService->findByUsername($username);
        $profile = $this->profileService->buildProfile($profileUser, $viewer);

        return response()->json([
            'profile' => $profile,
        ]);
    }

    public function toggleFollow(Request $request, string $username): JsonResponse
    {
        $viewer = $request->user('sanctum');
        if (! $viewer) {
            abort(401, 'No autenticado');
        }

        $profileUser = $this->profileService->findByUsername($username);

        if ($viewer->is($profileUser)) {
            throw ValidationException::withMessages([
                'username' => 'No puedes seguirte a ti mismo.',
            ]);
        }

        $viewer->toggleFollow($profileUser);
        $isFollowing = $viewer->isFollowing($profileUser);

        if ($isFollowing && ($profileUser->notify_followers ?? true)) {
            $profileUser->notify(new UserFollowedNotification($viewer));
        }

        return response()->json([
            'following' => $isFollowing,
            'followers_count' => $profileUser->followers()->count(),
        ]);
    }
}
