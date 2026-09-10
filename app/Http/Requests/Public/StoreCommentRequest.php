<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
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
            'body' => ['required', 'string', 'min:1', 'max:2000'],
            'reply_to_comment_id' => ['nullable', 'integer', 'exists:comments,id'],
            'is_spoiler' => ['sometimes', 'boolean'],
        ];
    }
}
