<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RestoreDatabaseRequest extends FormRequest
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
            'backup' => ['required', 'file', 'max:51200', 'mimetypes:application/gzip,application/x-gzip,application/octet-stream'],
            'confirm_email' => ['required', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $email = $this->string('confirm_email')->trim()->value();

            if ($email !== $this->user()?->email) {
                $validator->errors()->add('confirm_email', 'El correo no coincide con el de tu cuenta.');
            }
        });
    }
}
