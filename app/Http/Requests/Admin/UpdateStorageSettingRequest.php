<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStorageSettingRequest extends FormRequest
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
            'access_key' => ['required', 'string', 'max:255'],
            // Nullable: dejarla vacía significa "no cambiar la que ya hay
            // guardada" (mismo criterio que la api_key de un proveedor de IA).
            'secret_key' => ['nullable', 'string', 'max:255'],
            'bucket' => ['required', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:60'],
            'endpoint' => ['required', 'url', 'max:255'],
            'use_path_style_endpoint' => ['boolean'],
            'public_url' => ['nullable', 'url', 'max:255'],
        ];
    }
}
