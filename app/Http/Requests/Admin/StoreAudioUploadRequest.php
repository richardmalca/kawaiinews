<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAudioUploadRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:mp3,wav,ogg,m4a,aac', 'max:20480'],
            'news_article_id' => ['nullable', 'integer', 'exists:news_articles,id'],
        ];
    }
}
