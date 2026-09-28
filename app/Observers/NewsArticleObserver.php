<?php

namespace App\Observers;

use App\Models\NewsArticle;
use App\Services\Public\PushNotificationService;

class NewsArticleObserver
{
    public function __construct(private PushNotificationService $pushNotificationService) {}

    /**
     * Cubre tanto la creación directa ya publicada (ej. scraping
     * automático que inserta con status=published) como el caso más común
     * de pasar de borrador/pendiente a publicado en `updated`.
     */
    public function created(NewsArticle $article): void
    {
        if ($article->status === 'published') {
            $this->pushNotificationService->notifyArticlePublished($article);
        }
    }

    public function updated(NewsArticle $article): void
    {
        if ($article->wasChanged('status') && $article->status === 'published') {
            $this->pushNotificationService->notifyArticlePublished($article);
        }
    }
}
