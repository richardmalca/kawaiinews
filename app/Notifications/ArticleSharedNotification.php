<?php

namespace App\Notifications;

use App\Models\NewsArticle;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ArticleSharedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $sharer,
        public readonly NewsArticle $article,
        public readonly ?string $channel = null,
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
            'type' => 'article_shared',
            'sharer_id' => $this->sharer->id,
            'sharer_name' => $this->sharer->name,
            'sharer_username' => $this->sharer->username,
            'sharer_avatar' => $this->sharer->active_avatar_url,
            'channel' => $this->channel,
            'article_id' => $this->article->id,
            'article_title' => $this->article->title,
            'article_slug' => $this->article->slug,
            'featured_image' => $this->article->featured_image_url,
            'total_shares' => $this->totalCount,
            'url' => "/noticias/{$this->article->slug}",
        ];
    }
}
