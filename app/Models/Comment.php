<?php

namespace App\Models;

use Database\Factories\CommentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Overtrue\LaravelLike\Traits\Likeable;

/**
 * Comentario de una noticia. Los hilos se aplanan a 2 niveles: `parent_id`
 * es null si este comentario es la raíz del hilo, o apunta a la raíz si es
 * una respuesta (sin importar a qué respuesta específica se respondió).
 * `reply_to_comment_id` guarda esa respuesta específica solo para poder
 * mostrar "Respondiendo a @fulano" sin anidar visualmente más de un nivel.
 *
 * @property int $id
 * @property int $news_article_id
 * @property int $user_id
 * @property int|null $parent_id
 * @property int|null $reply_to_comment_id
 * @property string $body
 * @property bool $is_spoiler
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable(['news_article_id', 'user_id', 'parent_id', 'reply_to_comment_id', 'body', 'is_spoiler'])]
class Comment extends Model
{
    /** @use HasFactory<CommentFactory> */
    use HasFactory, Likeable, SoftDeletes;

    protected function casts(): array
    {
        return [
            'is_spoiler' => 'boolean',
        ];
    }

    public function newsArticle(): BelongsTo
    {
        return $this->belongsTo(NewsArticle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * El comentario raíz del hilo (null si este comentario ES la raíz).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    /**
     * Respuestas directas a este comentario, aplanadas bajo la raíz.
     * Solo tiene sentido llamarla sobre un comentario raíz (`parent_id === null`).
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')->orderBy('created_at');
    }

    /**
     * El comentario específico al que se respondió dentro del hilo
     * (puede ser la raíz misma o cualquier otra respuesta).
     */
    public function replyToComment(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'reply_to_comment_id');
    }

    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }
}
