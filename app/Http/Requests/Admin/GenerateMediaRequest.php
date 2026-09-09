<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class GenerateMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // gpt-image-1 acepta prompts de hasta 32000 caracteres; 4000 es
            // un tope generoso propio, no un límite real de la API — el
            // anterior (1000) quedó corto tras sumarle las instrucciones de
            // formato/estilo/sin-texto al prompt armado en el editor.
            'prompt' => ['required', 'string', 'max:4000'],
            'news_article_id' => ['nullable', 'integer', 'exists:news_articles,id'],
        ];
    }
}
