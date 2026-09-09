<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Public\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FollowController extends Controller
{
    public function __construct(private readonly ProfileService $profileService) {}

    public function toggle(Request $request, string $username): JsonResponse
    {
        $profileUser = $this->profileService->findByUsername($username);
        $user = $request->user();

        if ($user->is($profileUser)) {
            throw ValidationException::withMessages([
                'username' => 'No podés seguirte a vos mismo.',
            ]);
        }

        $user->toggleFollow($profileUser);

        return response()->json([
            'following' => $user->isFollowing($profileUser),
            'followers_count' => $profileUser->followers()->count(),
        ]);
    }
}
