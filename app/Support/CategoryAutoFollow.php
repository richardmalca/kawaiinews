<?php

namespace App\Support;

use App\Models\NewsArticle;
use App\Models\Share;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Suma el seguimiento de una categoría solo, a partir de señales de interés
 * del usuario — para que guardar/dar me gusta/compartir se traduzca en
 * avisos futuros de esa categoría sin que el usuario tenga que ir a
 * "Seguir" a mano. Guardar es una señal fuerte (se sigue siempre); dar me
 * gusta y compartir son gestos de un click muy frecuentes, así que solo
 * cuentan después de repetirse varias veces en la misma categoría — si no,
 * seguiríamos categorías por un solo like suelto que no significa mucho.
 */
class CategoryAutoFollow
{
    private const LIKE_THRESHOLD = 3;

    private const SHARE_THRESHOLD = 2;

    public static function afterFavorite(User $user, NewsArticle $article): void
    {
        $user->followCategory($article->category);
    }

    public static function afterLike(User $user, NewsArticle $article): void
    {
        if ($user->isFollowingCategory($article->category)) {
            return;
        }

        $likesInCategory = DB::table('likes')
            ->join('news_articles', 'news_articles.id', '=', 'likes.likeable_id')
            ->where('likes.likeable_type', NewsArticle::class)
            ->where('likes.user_id', $user->id)
            ->where('news_articles.category', $article->category)
            ->count();

        if ($likesInCategory >= self::LIKE_THRESHOLD) {
            $user->followCategory($article->category);
        }
    }

    public static function afterShare(User $user, NewsArticle $article): void
    {
        if ($user->isFollowingCategory($article->category)) {
            return;
        }

        $sharesInCategory = Share::where('user_id', $user->id)
            ->whereHas('newsArticle', fn ($query) => $query->where('category', $article->category))
            ->count();

        if ($sharesInCategory >= self::SHARE_THRESHOLD) {
            $user->followCategory($article->category);
        }
    }
}
