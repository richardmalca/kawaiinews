<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use App\Notifications\UserFollowedNotification;
use App\Services\Public\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $isFollowing = $user->isFollowing($profileUser);

        if ($isFollowing) {
            $profileUser->notify(new UserFollowedNotification($user));
        }

        return response()->json([
            'following' => $isFollowing,
            'followers_count' => $profileUser->followers()->count(),
        ]);
    }

    public function toggleTag(Request $request, Tag $tag): JsonResponse
    {
        $user = $request->user();
        $user->toggleFollow($tag);

        return response()->json([
            'following' => $user->isFollowing($tag),
            'followers_count' => $tag->followers()->count(),
        ]);
    }

    public function toggleCategory(Request $request, string $category): JsonResponse
    {
        $catalog = config('news_sources_catalog', []);
        if (! array_key_exists($category, $catalog)) {
            abort(404, 'Categoría no encontrada');
        }

        $user = $request->user();
        $isFollowing = $user->toggleFollowCategory($category);
        $followersCount = DB::table('category_user')
            ->where('category', $category)
            ->count();

        return response()->json([
            'following' => $isFollowing,
            'followers_count' => $followersCount,
        ]);
    }
}
