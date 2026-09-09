<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsClusterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $earliestPublishedAt = $this->earliestPublishedAt();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'summary' => $this->summary,
            'image_url' => $this->image_url,
            'sources_count' => $this->sources_count,
            'relevance_score' => $this->relevance_score,
            'status' => $this->status,
            'ai_verdict' => $this->ai_verdict,
            'ai_reason' => $this->ai_reason,
            'first_seen_at' => $this->first_seen_at?->diffForHumans(),
            'published_at' => $earliestPublishedAt?->diffForHumans(),
            'article_id' => $this->whenLoaded('article', fn () => $this->article?->id),
            'sources' => $this->whenLoaded('scrapedItems', fn () => $this->scrapedItems
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'url' => $item->url,
                    'source_label' => $item->newsSource->label,
                ])
                ->values()),
        ];
    }
}
