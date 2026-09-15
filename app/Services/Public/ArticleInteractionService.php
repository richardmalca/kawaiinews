<?php

namespace App\Services\Public;

use App\Models\ArticleReaction;
use App\Models\NewsArticle;
use App\Models\Share;
use App\Models\User;
use App\Notifications\ArticleLikedNotification;
use App\Notifications\ArticleSavedNotification;
use App\Notifications\ArticleSharedNotification;

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
        $favorited = $user->hasFavorited($article);

        // Notificar al autor si guardó la noticia y no es el autor mismo
        if ($favorited && $article->author_id && $article->author_id !== $user->id) {
            $author = $article->author;
            if ($author) {
                $existingNotification = $author->unreadNotifications()
                    ->where('type', ArticleSavedNotification::class)
                    ->where('data->article_id', $article->id)
                    ->first();

                $totalSaves = $article->favoriters()->count();

                if ($existingNotification) {
                    $data = $existingNotification->data;
                    $data['saver_id'] = $user->id;
                    $data['saver_name'] = $user->name;
                    $data['saver_username'] = $user->username;
                    $data['saver_avatar'] = $user->active_avatar_url;
                    $data['total_saves'] = $totalSaves;
                    $existingNotification->update([
                        'data' => $data,
                        'updated_at' => now(),
                    ]);
                } else {
                    $author->notify(new ArticleSavedNotification($user, $article, $totalSaves));
                }
            }
        }

        return [
            'favorited' => $favorited,
        ];
    }

    /**
     * @return array{shared: bool, total_shares: int}
     */
    public function recordShare(?User $user, NewsArticle $article, ?string $channel): array
    {
        $isFirstShareForUser = false;
        if ($user) {
            $existingShare = Share::where('user_id', $user->id)->where('news_article_id', $article->id)->first();
            if (! $existingShare) {
                $isFirstShareForUser = true;
            }

            Share::updateOrCreate(
                ['user_id' => $user->id, 'news_article_id' => $article->id],
                ['channel' => $channel, 'updated_at' => now(), 'created_at' => now()]
            );
        } else {
            Share::create([
                'user_id' => null,
                'news_article_id' => $article->id,
                'channel' => $channel,
            ]);
        }

        $totalShares = $article->shares()->count();

        // Notificar al autor de la noticia cuando un usuario registrado la comparte
        if ($user && $isFirstShareForUser && $article->author_id && $article->author_id !== $user->id) {
            $author = $article->author;
            if ($author) {
                $existingNotification = $author->unreadNotifications()
                    ->where('type', ArticleSharedNotification::class)
                    ->where('data->article_id', $article->id)
                    ->first();

                if ($existingNotification) {
                    $data = $existingNotification->data;
                    $data['sharer_id'] = $user->id;
                    $data['sharer_name'] = $user->name;
                    $data['sharer_username'] = $user->username;
                    $data['sharer_avatar'] = $user->active_avatar_url;
                    $data['channel'] = $channel;
                    $data['total_shares'] = $totalShares;
                    $existingNotification->update([
                        'data' => $data,
                        'updated_at' => now(),
                    ]);
                } else {
                    $author->notify(new ArticleSharedNotification($user, $article, $channel, $totalShares));
                }
            }
        }

        return [
            'shared' => true,
            'total_shares' => $totalShares,
        ];
    }

    /**
     * @return array{reaction: ?string, reactions: array<string, int>}
     */
    public function toggleReaction(User $user, NewsArticle $article, string $reaction): array
    {
        $existing = ArticleReaction::where('user_id', $user->id)
            ->where('news_article_id', $article->id)
            ->first();

        $isNewReaction = false;
        if ($existing && $existing->reaction === $reaction) {
            $existing->delete();
            $currentReaction = null;
        } elseif ($existing) {
            $existing->update(['reaction' => $reaction]);
            $currentReaction = $reaction;
        } else {
            ArticleReaction::create([
                'user_id' => $user->id,
                'news_article_id' => $article->id,
                'reaction' => $reaction,
            ]);
            $currentReaction = $reaction;
            $isNewReaction = true;
        }

        // Notificar al autor de la noticia (con agrupación para no saturar si hay 50 o 500 reacciones)
        if ($isNewReaction && $article->author_id && $article->author_id !== $user->id) {
            $author = $article->author;
            if ($author) {
                // Verificar si ya existe una notificación no leída para este artículo en las últimas 24 horas
                $existingNotification = $author->unreadNotifications()
                    ->where('type', ArticleLikedNotification::class)
                    ->where('data->article_id', $article->id)
                    ->first();

                $totalLikes = $article->reactions()->count();

                if ($existingNotification) {
                    // Actualizar la notificación existente agrupando el conteo
                    $data = $existingNotification->data;
                    $data['liker_id'] = $user->id;
                    $data['liker_name'] = $user->name;
                    $data['liker_username'] = $user->username;
                    $data['liker_avatar'] = $user->active_avatar_url;
                    $data['reaction'] = $reaction;
                    $data['total_reactions'] = $totalLikes;
                    $existingNotification->update([
                        'data' => $data,
                        'updated_at' => now(),
                    ]);
                } else {
                    $author->notify(new ArticleLikedNotification($user, $article, $reaction, $totalLikes));
                }
            }
        }

        return [
            'reaction' => $currentReaction,
            'reactions' => $this->getReactionsSummary($article),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function getReactionsSummary(NewsArticle $article): array
    {
        $allowed = ['fire', 'heart', 'shock', 'cry', 'think'];
        $raw = ArticleReaction::where('news_article_id', $article->id)
            ->selectRaw('reaction, count(*) as count')
            ->groupBy('reaction')
            ->pluck('count', 'reaction')
            ->toArray();

        $summary = [];
        foreach ($allowed as $key) {
            $summary[$key] = (int) ($raw[$key] ?? 0);
        }

        return $summary;
    }
}
