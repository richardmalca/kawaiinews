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
            'default_model' => ['required', 'string', 'max:255'],
            'api_key' => ['nullable', 'string'],
        ];
    }
}
