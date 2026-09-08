<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use RuntimeException;

class MediaLibraryService
{
    /**
     * @var array<string, string>
     */
    private const IMAGE_MODELS = [
        'openai' => 'dall-e-3',
        'gemini' => 'imagen-4',
    ];

    public function list()
    {
        return Media::orderByDesc('id')->get();
    }

    public function storeUpload(UploadedFile $file): Media
    {
        $path = $file->store('media', 'public');

        return Media::create([
            'url' => Storage::disk('public')->url($path),
            'original_name' => $file->getClientOriginalName(),
            'source' => 'upload',
        ]);
    }

    public function storeFromUrl(string $url): Media
    {
        return Media::create([
            'url' => $url,
            'original_name' => Str::afterLast(parse_url($url, PHP_URL_PATH) ?? '', '/') ?: null,
            'source' => 'url',
        ]);
    }

    public function generateWithAi(string $prompt): Media
    {
        $provider = AiProvider::whereIn('provider', array_keys(self::IMAGE_MODELS))
            ->whereNotNull('api_key')
            ->first();

        if (! $provider) {
            throw new RuntimeException('No hay un proveedor con soporte de imágenes configurado (OpenAI o Gemini). Agrégalo en Modelo de IA.');
        }

        $response = Prism::image()
            ->using($provider->provider, self::IMAGE_MODELS[$provider->provider], [
                'api_key' => $provider->api_key,
            ])
            ->withPrompt($prompt)
            ->generate();

        $image = $response->firstImage();

        if ($image->hasBase64()) {
            $path = 'media/'.uniqid('ai-', true).'.png';
            Storage::disk('public')->put($path, base64_decode($image->base64));

            return Media::create([
                'url' => Storage::disk('public')->url($path),
                'original_name' => Str::limit($prompt, 60, ''),
                'source' => 'ai',
            ]);
        }

        return Media::create([
            'url' => $image->url,
            'original_name' => Str::limit($prompt, 60, ''),
            'source' => 'ai',
        ]);
    }

    public function delete(Media $media): void
    {
        if (Str::startsWith($media->url, Storage::disk('public')->url(''))) {
            $path = Str::after($media->url, Storage::disk('public')->url(''));
            Storage::disk('public')->delete($path);
        }

        $media->delete();
    }
}
