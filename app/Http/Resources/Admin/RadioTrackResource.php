<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RadioTrackResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'artist' => $this->artist,
            'url' => $this->url,
            'duration_seconds' => $this->duration_seconds,
            'active' => $this->active,
            'created_at_formatted' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
