<?php

namespace App\Notifications;

use App\Models\NewsArticle;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class NewArticlePublishedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly NewsArticle $article,
        public readonly string $reason = 'author',
        public readonly ?string $reasonLabel = null
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
        $author = $this->article->author;

        return [
            'type' => 'new_article',
            'article_id' => $this->article->id,
            'article_title' => $this->article->title,
            'article_slug' => $this->article->slug,
            'article_excerpt' => Str::limit($this->article->excerpt ?? '', 100),
            'featured_image' => $this->article->featured_image,
            'category' => $this->article->category,
            'author_id' => $author?->id,
            'author_name' => $author?->name,
            'author_username' => $author?->username,
            'author_avatar' => $author?->active_avatar_url,
            'reason' => $this->reason,
            'reason_label' => $this->reasonLabel,
            'url' => "/noticias/{$this->article->slug}",
        ];
    }
}
