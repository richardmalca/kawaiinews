<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    /**
     * El autor puede editar su propio comentario. El staff no edita
     * comentarios ajenos (solo puede borrarlos vía delete()).
     */
    public function update(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id;
    }

    /**
     * El autor puede borrar su propio comentario; el staff (superadmin,
     * admin, editor) puede moderar y borrar cualquiera.
     */
    public function delete(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id
            || $user->hasRole(['superadmin', 'admin', 'editor']);
    }
}
