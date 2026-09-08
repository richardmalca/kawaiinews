<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiProviderResource extends JsonResource
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
            'provider' => $this->provider,
            'label' => $this->label,
            'default_model' => $this->default_model,
            'has_api_key' => $this->hasApiKey(),
            'is_active' => $this->is_active,
            'last_verified_at' => $this->last_verified_at?->diffForHumans(),
        ];
    }
}
