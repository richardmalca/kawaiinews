<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class CommentLikedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $liker,
        public readonly Comment $comment,
        public readonly int $totalCount = 1
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $article = $this->comment->newsArticle;

        return [
            'type' => 'comment_liked',
            'liker_id' => $this->liker->id,
            'liker_name' => $this->liker->name,
            'liker_username' => $this->liker->username,
            'liker_avatar' => $this->liker->active_avatar_url,
            'comment_id' => $this->comment->id,
            'comment_preview' => Str::limit($this->comment->body, 90),
            'article_id' => $article?->id,
            'article_title' => $article?->title,
            'article_slug' => $article?->slug,
            'total_reactions' => $this->totalCount,
            'url' => $article ? "/noticias/{$article->slug}#comentario-{$this->comment->id}" : '/',
        ];
    }
}
