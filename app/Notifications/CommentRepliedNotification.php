<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class CommentRepliedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Comment $reply,
        public readonly User $replier
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
        $article = $this->reply->newsArticle;

        return [
            'type' => 'comment_reply',
            'comment_id' => $this->reply->id,
            'replier_id' => $this->replier->id,
            'replier_name' => $this->replier->name,
            'replier_username' => $this->replier->username,
            'replier_avatar' => $this->replier->active_avatar_url,
            'article_id' => $article?->id,
            'article_title' => $article?->title,
            'article_slug' => $article?->slug,
            'reply_preview' => Str::limit($this->reply->body, 90),
            'url' => $article ? "/noticias/{$article->slug}#comentario-{$this->reply->id}" : '/',
        ];
    }
}
