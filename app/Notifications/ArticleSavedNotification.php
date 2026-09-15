<?php

namespace App\Notifications;

use App\Models\NewsArticle;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ArticleSavedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $saver,
        public readonly NewsArticle $article,
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
            'type' => 'article_saved',
            'saver_id' => $this->saver->id,
            'saver_name' => $this->saver->name,
            'saver_username' => $this->saver->username,
            'saver_avatar' => $this->saver->active_avatar_url,
            'article_id' => $this->article->id,
            'article_title' => $this->article->title,
            'article_slug' => $this->article->slug,
            'featured_image' => $this->article->featured_image_url,
            'total_saves' => $this->totalCount,
            'url' => "/noticia/{$this->article->slug}",
        ];
    }
}
