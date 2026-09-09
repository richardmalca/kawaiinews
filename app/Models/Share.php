<?php

namespace App\Models;

use Database\Factories\ShareFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Registro de que un usuario (o un visitante anónimo) compartió una noticia.
 * Es un contador/historial, no un "repost": solo aparece en el perfil
 * público del usuario si él activó `show_shares_on_profile`.
 *
 * @property int $id
 * @property int|null $user_id
 * @property int $news_article_id
 * @property string|null $channel
 */
#[Fillable(['user_id', 'news_article_id', 'channel'])]
class Share extends Model
{
    /** @use HasFactory<ShareFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function newsArticle(): BelongsTo
    {
        return $this->belongsTo(NewsArticle::class);
    }
}
