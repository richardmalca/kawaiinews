<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminCommentResource extends JsonResource
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
            'is_reply' => $this->parent_id !== null,
            'status' => $this->status,
            'created_at' => $this->created_at?->diffForHumans(),
            'created_at_formatted' => $this->created_at?->translatedFormat('d M, Y H:i'),
            'likes_count' => (int) ($this->likers_count ?? $this->likers()->count()),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'avatar' => $this->user->active_avatar_url,
            ] : null),
            'article' => $this->whenLoaded('newsArticle', fn () => $this->newsArticle ? [
                'id' => $this->newsArticle->id,
                'title' => $this->newsArticle->title,
                'slug' => $this->newsArticle->slug,
                'category' => $this->newsArticle->category,
            ] : null),
            'reply_to' => $this->whenLoaded('replyToComment', fn () => $this->replyToComment?->user ? [
                'user_id' => $this->replyToComment->user->id,
                'name' => $this->replyToComment->user->name,
                'username' => $this->replyToComment->user->username,
            ] : null),
        ];
    }
}
