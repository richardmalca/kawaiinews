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
            'views_count' => $this->views_count,
            'published_at' => $this->published_at?->diffForHumans(),
            'published_at_formatted' => $this->published_at?->translatedFormat('d \d\e F, Y'),
            'published_at_time' => $this->published_at?->format('H:i'),
            'created_at' => $this->created_at?->diffForHumans(),
            // Columna propia (igual que `featured_image`), no derivada de la
            // relación `media` — así elegir un audio de la biblioteca es
            // simplemente copiar su URL, sin reasignar a qué artículo
            // "pertenece" ese Media (que podría estar usado en otra noticia).
            'audio_url' => $this->audio_url,
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')->values()),
        ];
    }
}
