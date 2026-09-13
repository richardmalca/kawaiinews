<?php

namespace App\Services\Public;

use App\Models\NewsArticle;
use App\Models\User;

class ProfileService
{
    public function findByUsername(string $username): User
    {
        $normalized = trim($username);

        return User::whereRaw('LOWER(username) = LOWER(?)', [$normalized])->firstOrFail();
    }

    /**
     * Datos públicos de un perfil. `publishedArticlesCount` solo se calcula
     * para superadmin/editor, los únicos roles que redactan noticias en
     * KawaiiNews. Los compartidos (`shares`) solo se listan si el propio
     * usuario activó `show_shares_on_profile`.
     *
     * @return array<string, mixed>
     */
    public function buildProfile(User $profileUser, ?User $viewer): array
    {
        $isAuthor = $profileUser->hasRole(['superadmin', 'editor']);

        return [
            'id' => $profileUser->id,
            'name' => $profileUser->name,
            'username' => $profileUser->username,
            'avatar' => $profileUser->active_avatar_url,
            'google_avatar' => $profileUser->avatar,
            'custom_avatar' => $profileUser->custom_avatar,
            'banner' => $profileUser->banner,
            'avatar_source' => $profileUser->avatar_source ?? 'google',
            'is_author' => $isAuthor,
            'badge' => $profileUser->community_badge,
            'published_articles_count' => ($isAuthor || $profileUser->publishedArticlesCount() > 0) ? $profileUser->publishedArticlesCount() : null,
            'total_articles_likes_count' => ($isAuthor || $profileUser->publishedArticlesCount() > 0) ? $profileUser->totalArticlesLikesCount() : null,
            'followers_count' => $profileUser->followers()->count(),
            'following_count' => $profileUser->followings()->accepted()->count(),
            'is_following' => $viewer ? $viewer->isFollowing($profileUser) : false,
            'is_self' => $viewer?->is($profileUser) ?? false,
            'shares_visible' => $profileUser->show_shares_on_profile,
            'published_articles' => ($isAuthor || $profileUser->publishedArticlesCount() > 0)
                ? $profileUser->authoredArticles()
                    ->where('status', 'published')
                    ->withCount(['likers as likes_count'])
                    ->latest('published_at')
                    ->limit(20)
                    ->get()
                    ->map(function (NewsArticle $article) {
                        return [
                            'id' => $article->id,
                            'title' => $article->title,
                            'slug' => $article->slug,
                            'category' => $article->category,
                            'excerpt' => $article->excerpt,
                            'featured_image' => $article->featured_image,
                            'likes_count' => (int) ($article->likes_count ?? 0),
                            'views_count' => (int) ($article->views_count ?? 0),
                            'published_at' => $article->published_at?->diffForHumans(),
                            'published_date' => $article->published_at?->translatedFormat('d M, Y'),
                        ];
                    })
                    ->values()
                : [],
            'shares' => $profileUser->show_shares_on_profile
                ? $profileUser->shares()
                    ->with('newsArticle:id,title,slug,category,excerpt,featured_image')
                    ->latest()
                    ->limit(20)
                    ->get()
                    ->filter(fn ($share) => $share->newsArticle !== null)
                    ->map(function ($share) {
                        $article = $share->newsArticle;

                        return [
                            'id' => $article->id,
                            'title' => $article->title,
                            'slug' => $article->slug,
                            'category' => $article->category,
                            'excerpt' => $article->excerpt,
                            'featured_image' => $article->featured_image,
                            'shared_at' => $share->created_at?->diffForHumans(),
                            'shared_date' => $share->created_at?->translatedFormat('d M, Y'),
                        ];
                    })
                    ->values()
                : [],
            'favorites' => ($viewer?->is($profileUser) ?? false)
                ? $profileUser->getFavoriteItems(NewsArticle::class)
                    ->take(20)
                    ->get()
                    ->map(function (NewsArticle $article) {
                        return [
                            'id' => $article->id,
                            'title' => $article->title,
                            'slug' => $article->slug,
                            'category' => $article->category,
                            'excerpt' => $article->excerpt,
                            'featured_image' => $article->featured_image,
                        ];
                    })
                    ->values()
                : [],
            'likes' => ($viewer?->is($profileUser) ?? false)
                ? $profileUser->getLikedItems(NewsArticle::class)
                    ->where('status', 'published')
                    ->take(20)
                    ->get()
                    ->map(function (NewsArticle $article) {
                        return [
                            'id' => $article->id,
                            'title' => $article->title,
                            'slug' => $article->slug,
                            'category' => $article->category,
                            'excerpt' => $article->excerpt,
                            'featured_image' => $article->featured_image,
                        ];
                    })
                    ->values()
                : [],
        ];
    }
}
