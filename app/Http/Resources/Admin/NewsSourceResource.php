<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsSourceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source_key' => $this->source_key,
            'category' => $this->category,
            'label' => $this->label,
            'url' => $this->url,
            'rss_url' => $this->rss_url,
            'is_active' => $this->is_active,
            'last_scraped_at' => $this->last_scraped_at?->diffForHumans(),
        ];
    }
}
