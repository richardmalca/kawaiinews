<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RadioQueueItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'position' => $this->position,
            'type' => $this->type,
            'title' => $this->title,
            'audio_url' => $this->audio_url,
            'duration_seconds' => $this->duration_seconds,
            'news_article_id' => $this->news_article_id,
        ];
    }
}
