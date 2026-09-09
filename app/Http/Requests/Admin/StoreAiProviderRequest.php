<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAiProviderRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'provider' => [
                'required',
                'string',
                Rule::in(array_keys(config('ai_catalog'))),
                Rule::unique('ai_providers', 'provider'),
            ],
            'label' => ['required', 'string', 'max:255'],
            // Nullable: proveedores sin modelos de texto (ej. ElevenLabs, solo
            // audio) no tienen nada que elegir acá; AiProviderService rellena
            // un valor placeholder que nunca se usa para generar texto.
            'default_model' => ['nullable', 'string', 'max:255'],
            'api_key' => ['nullable', 'string'],
        ];
    }
}
