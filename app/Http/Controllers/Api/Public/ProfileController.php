<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
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
