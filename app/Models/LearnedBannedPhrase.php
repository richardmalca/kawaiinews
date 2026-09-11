<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Palabra/frase que la Capa 2 (IA) de moderación de comentarios identificó
 * como ofensiva al bloquear un comentario. Se suma acá para que la Capa 1
 * (filtro por reglas, gratis) la agarre sola la próxima vez, sin volver a
 * consultar a la IA por lo mismo.
 *
 * @property int $id
 * @property string $phrase
 * @property int|null $comment_id
 * @property Carbon|null $created_at
 */
#[Fillable(['phrase', 'comment_id'])]
class LearnedBannedPhrase extends Model
{
    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }
}
