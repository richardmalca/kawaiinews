<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Palabras que no pueden usarse como @usuario porque colisionan con
     * segmentos de ruta reales (ej. `perfil/mi-cuenta/settings`).
     *
     * @var array<int, string>
     */
    private const RESERVED_USERNAMES = ['mi-cuenta', 'admin', 'settings', 'api', 'perfil'];

    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null, bool $usernameRequired = false): array
    {
        return [
            'name' => $this->nameRules(),
            'username' => $this->usernameRules($userId, $usernameRequired),
            'email' => $this->emailRules($userId),
            'show_shares_on_profile' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get the validation rules used to validate the public `@usuario` handle.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function usernameRules(?int $userId = null, bool $required = false): array
    {
        return [
            // "sometimes"/"nullable" por defecto: el formulario de
            // /settings/profile (panel admin) no gestiona el @usuario, así
            // que no debe romper el guardado normal del nombre/email. La
            // página pública de configuración de perfil (/perfil/{username}/
            // settings) pasa $required = true porque ahí sí es el campo
            // principal.
            ...($required ? ['required'] : ['sometimes', 'nullable']),
            'string',
            'min:3',
            'max:30',
            'regex:/^[a-zA-Z0-9_.]+$/',
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
