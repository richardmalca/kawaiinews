<?php

namespace App\Http\Resources\Shared;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsArticleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'featured_image' => $this->featured_image,
            'status' => $this->status,
            'published_at' => $this->published_at?->diffForHumans(),
            'published_at_formatted' => $this->published_at?->translatedFormat('d \d\e F, Y'),
            'published_at_time' => $this->published_at?->format('H:i'),
            'created_at' => $this->created_at?->diffForHumans(),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')->values()),
        ];
    }
}
