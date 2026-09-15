<?php

namespace App\Services\Public;

use App\Models\ArticleReaction;
use App\Models\NewsArticle;
use App\Models\Share;
use App\Models\User;
use App\Notifications\ArticleLikedNotification;

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
        if ($user) {
            // Un usuario logueado solo tiene un share por noticia: si ya la
            // había compartido, actualizamos el canal y la fecha en vez de
            // duplicar la fila (eso es lo que inflaba su perfil).
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

        return [
            'shared' => true,
            'total_shares' => $article->shares()->count(),
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
