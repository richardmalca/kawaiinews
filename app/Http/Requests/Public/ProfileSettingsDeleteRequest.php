<?php

namespace App\Http\Requests\Public;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileSettingsDeleteRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return $this->user()?->username === $this->route('username');
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        if ($user?->google_id) {
            return [
                'confirmation' => ['required', 'string', 'in:'.$user->username],
            ];
        }

        return [
            'password' => $this->currentPasswordRules(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'confirmation.in' => 'El nombre de usuario no coincide para confirmar la eliminación.',
            'confirmation.required' => 'Debes escribir tu nombre de usuario para confirmar la eliminación.',
        ];
    }
}
