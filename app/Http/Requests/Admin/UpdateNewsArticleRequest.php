<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNewsArticleRequest extends FormRequest
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
        $categories = array_keys(config('news_sources_catalog'));

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in($categories)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['nullable', 'string'],
            'featured_image' => ['nullable', 'string', 'url', 'max:500'],
            'audio_url' => ['nullable', 'string', 'url', 'max:500'],
            'status' => ['required', 'string', Rule::in(['draft', 'published'])],
            'tags' => ['array'],
            'tags.*' => ['string', 'max:50'],
        ];
    }
}
