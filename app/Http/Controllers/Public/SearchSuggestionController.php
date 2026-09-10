<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsArticle;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchSuggestionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $rawQuery = (string) $request->query('q', '');
        $term = trim($rawQuery);

        if (mb_strlen($term) < 2) {
            return response()->json([
                'tags' => [],
                'users' => [],
                'articles' => [],
            ]);
        }

        $cleanTerm = ltrim(ltrim($term, '#'), '@');

        $tags = Tag::query()
            ->where(function ($query) use ($cleanTerm) {
                $query->where('name', 'like', "%{$cleanTerm}%")
                    ->orWhere('slug', 'like', "%{$cleanTerm}%");
            })
            ->whereHas('articles', fn ($q) => $q->where('status', 'published')->whereNotNull('published_at'))
            ->withCount(['articles' => fn ($q) => $q->where('status', 'published')->whereNotNull('published_at')])
            ->orderByDesc('articles_count')
            ->take(5)
            ->get(['id', 'name', 'slug']);

        $cleanUsername = ltrim($term, '@');

        $users = User::query()
            ->whereNotNull('username')
            ->where(function ($query) use ($cleanUsername) {
                $query->where('username', 'like', "{$cleanUsername}%")
                    ->orWhere('name', 'like', "%{$cleanUsername}%");
            })
            ->select(['id', 'name', 'username', 'avatar', 'custom_avatar', 'avatar_source'])
            ->take(5)
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->active_avatar_url,
                    'is_author' => $user->hasRole(['superadmin', 'editor']),
                ];
            });

        $articles = NewsArticle::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where(function ($query) use ($term) {
                $query->where('title', 'like', "%{$term}%")
                    ->orWhere('excerpt', 'like', "%{$term}%");
            })
            ->select(['id', 'title', 'slug', 'category', 'featured_image'])
            ->orderByDesc('published_at')
            ->take(5)
            ->get();

        return response()->json([
            'tags' => $tags,
            'users' => $users,
            'articles' => $articles,
        ]);
    }
}
