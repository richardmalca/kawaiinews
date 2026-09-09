<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'original_name' => $this->original_name,
            'source' => $this->source,
            'provider' => $this->provider,
            'model' => $this->model,
            'type' => $this->type,
            'news_article_id' => $this->news_article_id,
            'article_title' => $this->whenLoaded('newsArticle', fn () => $this->newsArticle?->title),
            'created_at' => $this->created_at?->diffForHumans(),
            'created_at_formatted' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
