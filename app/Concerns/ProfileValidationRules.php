<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Palabras que no pueden usarse como @usuario porque colisionan con
     * segmentos de ruta reales (ej. `perfil/mi-cuenta/ajustes`).
     *
     * @var array<int, string>
     */
    private const RESERVED_USERNAMES = ['mi-cuenta', 'admin', 'ajustes', 'settings', 'api', 'perfil'];

    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null, bool $usernameRequired = false, bool $includeEmail = true): array
    {
        $rules = [
            'name' => $this->nameRules(),
            'username' => $this->usernameRules($userId, $usernameRequired),
            'show_shares_on_profile' => ['sometimes', 'boolean'],
            'avatar_source' => ['sometimes', 'string', 'in:google,custom'],
            'custom_avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,png,webp,gif', 'max:2048'],
            'banner' => [
                'sometimes',
                'nullable',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value instanceof UploadedFile) {
                        if (! in_array($value->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
                            $fail('La imagen de portada debe ser un archivo JPG, PNG o WebP.');
                        }
                        if ($value->getSize() > 4096 * 1024) {
                            $fail('La imagen de portada no debe superar los 4 MB.');
                        }
                    } elseif (! is_string($value)) {
                        $fail('El formato de portada no es válido.');
                    }
                },
            ],
        ];

        if ($includeEmail) {
            $rules['email'] = $this->emailRules($userId);
        }

        return $rules;
    }

    /**
     * Get the validation rules used to validate the public `@usuario` handle.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function usernameRules(?int $userId = null, bool $required = false): array
    {
        return [
            ...($required ? ['required'] : ['sometimes', 'nullable']),
            'string',
            'min:3',
            'max:25',
            'regex:/^[a-zA-Z0-9_]+$/',
            Rule::notIn(self::RESERVED_USERNAMES),
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
