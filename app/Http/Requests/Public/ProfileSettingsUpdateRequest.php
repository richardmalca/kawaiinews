<?php

namespace App\Http\Requests\Public;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileSettingsUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Solo el dueño del perfil puede editar su propia configuración pública.
     */
    public function authorize(): bool
    {
        return $this->user()?->username === $this->route('username');
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->profileRules($this->user()->id, usernameRequired: true, includeEmail: false);
    }
}
