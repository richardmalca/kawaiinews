<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

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
            'password' => ['required', 'string', 'current_password'],
        ];
    }
}
