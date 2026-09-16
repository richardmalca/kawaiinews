<?php

namespace App\Notifications;

use App\Models\NewsArticle;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ArticleLikedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $liker,
        public readonly NewsArticle $article,
        public readonly string $reaction,
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
            'type' => 'article_liked',
            'liker_id' => $this->liker->id,
            'liker_name' => $this->liker->name,
            'liker_username' => $this->liker->username,
            'liker_avatar' => $this->liker->active_avatar_url,
            'reaction' => $this->reaction,
            'article_id' => $this->article->id,
            'article_title' => $this->article->title,
            'article_slug' => $this->article->slug,
            'featured_image' => $this->article->featured_image_url,
            'total_reactions' => $this->totalCount,
            'url' => "/noticias/{$this->article->slug}",
        ];
    }
}
