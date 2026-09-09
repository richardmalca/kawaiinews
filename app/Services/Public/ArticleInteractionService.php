<?php

namespace App\Services\Public;

use App\Models\NewsArticle;
use App\Models\Share;
use App\Models\User;

class ArticleInteractionService
{
    /**
     * @return array{liked: bool, total_likers: int}
     */
    public function toggleLike(User $user, NewsArticle $article): array
    {
        $user->toggleLike($article);

        return [
            'liked' => $user->hasLiked($article),
            'total_likers' => $article->likers()->count(),
        ];
    }

    /**
     * @return array{favorited: bool}
     */
    public function toggleFavorite(User $user, NewsArticle $article): array
    {
        $user->toggleFavorite($article);

        return [
            'favorited' => $user->hasFavorited($article),
        ];
    }

    /**
     * @return array{shared: bool, total_shares: int}
     */
    public function recordShare(?User $user, NewsArticle $article, ?string $channel): array
    {
        Share::create([
            'user_id' => $user?->id,
            'news_article_id' => $article->id,
            'channel' => $channel,
        ]);

        return [
            'shared' => true,
            'total_shares' => $article->shares()->count(),
        ];
    }
}
