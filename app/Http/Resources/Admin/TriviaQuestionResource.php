<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TriviaQuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question,
            'active_date' => $this->active_date?->toDateString(),
            'is_active' => $this->is_active,
            'answers_count' => $this->answers_count,
            'options' => $this->options->map(fn ($option) => [
                'id' => $option->id,
                'label' => $option->label,
                'is_correct' => $option->is_correct,
            ]),
        ];
    }
}
