<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class ArticleCommentedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $commenter,
        public readonly NewsArticle $article,
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
        return [
            'type' => 'article_commented',
            'commenter_id' => $this->commenter->id,
            'commenter_name' => $this->commenter->name,
            'commenter_username' => $this->commenter->username,
            'commenter_avatar' => $this->commenter->active_avatar_url,
            'comment_id' => $this->comment->id,
            'comment_preview' => Str::limit($this->comment->body, 90),
            'article_id' => $this->article->id,
            'article_title' => $this->article->title,
            'article_slug' => $this->article->slug,
            'featured_image' => $this->article->featured_image,
            'total_comments' => $this->totalCount,
            'url' => "/noticias/{$this->article->slug}#comentario-{$this->comment->id}",
        ];
    }
}
