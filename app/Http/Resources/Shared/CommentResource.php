<?php

namespace App\Http\Resources\Shared;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'is_spoiler' => (bool) $this->is_spoiler,
            // Para que el propio autor sepa que lo que acaba de mandar
            // quedó en revisión (filtro automático) en vez de creer que no
            // se guardó — nadie más ve este campo importar, un comentario
            // pending ni siquiera aparece en el listado público.
            'is_pending' => $this->status === 'pending',
            'created_at' => $this->created_at?->diffForHumans(),
            'created_at_iso' => $this->created_at?->toIso8601String(),
            'is_edited' => $this->updated_at && $this->created_at && ! $this->updated_at->eq($this->created_at),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'avatar' => $this->user->active_avatar_url,
            ] : null),
            'reply_to' => $this->whenLoaded('replyToComment', fn () => $this->replyToComment?->user ? [
                'comment_id' => $this->replyToComment->id,
                'user_id' => $this->replyToComment->user->id,
                'name' => $this->replyToComment->user->name,
                'username' => $this->replyToComment->user->username,
            ] : null),
            'likes_count' => (int) ($this->likers_count ?? $this->likers()->count()),
            'has_liked' => $request->user() ? $request->user()->hasLiked($this->resource) : false,
            'can_update' => $request->user()?->can('update', $this->resource) ?? false,
            'can_delete' => $request->user()?->can('delete', $this->resource) ?? false,
            'replies' => $this->whenLoaded('replies', fn () => CommentResource::collection($this->replies)),
        ];
    }
}
