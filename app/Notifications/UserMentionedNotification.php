<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class UserMentionedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Comment $comment,
        public readonly User $mentioner
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
            'type' => 'comment_mention',
            'comment_id' => $this->comment->id,
            'mentioner_id' => $this->mentioner->id,
            'mentioner_name' => $this->mentioner->name,
            'mentioner_username' => $this->mentioner->username,
            'mentioner_avatar' => $this->mentioner->active_avatar_url,
            'article_id' => $article?->id,
            'article_title' => $article?->title,
            'article_slug' => $article?->slug,
            'comment_preview' => Str::limit($this->comment->body, 90),
            'url' => $article ? "/noticias/{$article->slug}#comentario-{$this->comment->id}" : '/',
        ];
    }
}
