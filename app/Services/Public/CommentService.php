<?php

namespace App\Services\Public;

use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class CommentService
{
    /**
     * Comentarios raíz de una noticia, paginados, con sus respuestas
     * (aplanadas a un solo nivel) ya cargadas.
     */
    public function listForArticle(NewsArticle $article, int $perPage = 15): LengthAwarePaginator
    {
        return Comment::query()
            ->where('news_article_id', $article->id)
            ->whereNull('parent_id')
            ->withCount('likers')
            ->with([
                'user:id,name,username,avatar,custom_avatar,avatar_source',
                'replies' => fn ($query) => $query
                    ->withCount('likers')
                    ->with([
                        'user:id,name,username,avatar,custom_avatar,avatar_source',
                        'replyToComment.user:id,name,username',
                    ]),
            ])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Crea un comentario raíz o una respuesta. Si `replyToCommentId` apunta
     * a una respuesta (no a la raíz), el nuevo comentario igual cuelga de
     * la raíz del hilo (se aplana), pero guarda a quién le está
     * respondiendo puntualmente para poder mostrar "Respondiendo a @fulano".
     */
    public function store(User $user, NewsArticle $article, string $body, ?int $replyToCommentId = null, bool $isSpoiler = false): Comment
    {
        $parentId = null;
        $replyToId = null;

        if ($replyToCommentId !== null) {
            $target = Comment::where('news_article_id', $article->id)->findOrFail($replyToCommentId);

            if ($target->isRoot()) {
                $parentId = $target->id;
            } else {
                $parentId = $target->parent_id;
                $replyToId = $target->id;
            }
        }

        return Comment::create([
            'news_article_id' => $article->id,
            'user_id' => $user->id,
            'parent_id' => $parentId,
            'reply_to_comment_id' => $replyToId,
            'body' => $body,
            'is_spoiler' => $isSpoiler,
        ]);
    }

    public function update(Comment $comment, string $body, ?bool $isSpoiler = null): Comment
    {
        $comment->update([
            'body' => $body,
            ...($isSpoiler !== null ? ['is_spoiler' => $isSpoiler] : []),
        ]);

        return $comment;
    }

    public function delete(Comment $comment): void
    {
        if ($comment->isRoot()) {
            // Al borrar la raíz se van todas sus respuestas: son parte del
            // mismo hilo y no tiene sentido dejarlas huérfanas.
            $comment->replies()->delete();
        }

        $comment->delete();
    }

    /**
     * @return array{liked: bool, total_likers: int}
     */
    public function toggleLike(User $user, Comment $comment): array
    {
        $user->toggleLike($comment);

        return [
            'liked' => $user->hasLiked($comment),
            'total_likers' => $comment->likers()->count(),
        ];
    }

    public function ensureBelongsToArticle(Comment $comment, NewsArticle $article): void
    {
        if ($comment->news_article_id !== $article->id) {
            throw ValidationException::withMessages([
                'comment' => 'Este comentario no pertenece a esta noticia.',
            ]);
        }
    }

    /**
     * Listado plano (raíces y respuestas mezcladas, más nuevo primero) para
     * el panel de moderación — a diferencia de listForArticle(), acá no
     * interesa el aplanado visual del hilo, sino poder buscar/filtrar
     * cualquier comentario de cualquier noticia de un vistazo.
     *
     * @param  array{search?: ?string, article_id?: ?int, spoilers_only?: bool}  $filters
     */
    public function adminList(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return Comment::query()
            ->withCount('likers')
            ->with([
                'user:id,name,username,avatar,custom_avatar,avatar_source',
                'newsArticle:id,title,slug,category',
                'replyToComment.user:id,name,username',
            ])
            ->when(
                $filters['search'] ?? null,
                fn ($query, $search) => $query->where('body', 'like', "%{$search}%")
            )
            ->when(
                $filters['article_id'] ?? null,
                fn ($query, $articleId) => $query->where('news_article_id', $articleId)
            )
            ->when(
                $filters['spoilers_only'] ?? false,
                fn ($query) => $query->where('is_spoiler', true)
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @return array{total: int, today: int, this_week: int, spoilers: int, replies: int}
     */
    public function adminKpis(): array
    {
        $today = now()->toDateString();
        $weekAgo = now()->subDays(6)->toDateString();

        return [
            'total' => Comment::count(),
            'today' => Comment::whereDate('created_at', $today)->count(),
            'this_week' => Comment::whereDate('created_at', '>=', $weekAgo)->count(),
            'spoilers' => Comment::where('is_spoiler', true)->count(),
            'replies' => Comment::whereNotNull('parent_id')->count(),
        ];
    }
}
