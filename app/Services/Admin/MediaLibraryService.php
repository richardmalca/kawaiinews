<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use RuntimeException;

class MediaLibraryService
{
    private const AUDIO_MAX_CHARS = 3500;

    private function resolveImageProvider(): ?AiProvider
    {
        $active = AiProvider::where('is_active_for_images', true)->whereNotNull('api_key')->first();

        if ($active && $active->supportsImages()) {
            return $active;
        }

        return AiProvider::whereIn('provider', $this->providersSupporting('image_model'))
            ->whereNotNull('api_key')
            ->first();
    }

    private function resolveAudioProvider(): ?AiProvider
    {
        $active = AiProvider::where('is_active_for_audio', true)->whereNotNull('api_key')->first();

        if ($active && $active->supportsAudio()) {
            return $active;
        }

        return AiProvider::whereIn('provider', $this->providersSupporting('audio_model'))
            ->whereNotNull('api_key')
            ->first();
    }

    /**
     * @return array<int, string>
     */
    private function providersSupporting(string $modelKey): array
    {
        return collect(config('ai_catalog'))
            ->filter(fn (array $entry) => filled($entry[$modelKey] ?? null))
            ->keys()
            ->all();
    }

    public function list(): Collection
    {
        return Media::where('type', 'image')->orderByDesc('id')->get();
    }

    public function listAudio(): Collection
    {
        return Media::where('type', 'audio')->with('newsArticle')->orderByDesc('id')->get();
    }

    public function storeUpload(UploadedFile $file, ?int $newsArticleId = null): Media
    {
        $path = $file->store('media', 'public');

        return Media::create([
            'url' => Storage::disk('public')->url($path),
            'original_name' => $file->getClientOriginalName(),
            'source' => 'upload',
            'type' => 'image',
            'news_article_id' => $newsArticleId,
        ]);
    }

    public function storeAudioUpload(UploadedFile $file, ?int $newsArticleId = null): Media
    {
        $path = $file->store('audio', 'public');

        return Media::create([
            'url' => Storage::disk('public')->url($path),
            'original_name' => $file->getClientOriginalName(),
            'source' => 'upload',
            'type' => 'audio',
            'news_article_id' => $newsArticleId,
        ]);
    }

    public function storeFromUrl(string $url, ?int $newsArticleId = null): Media
    {
        return Media::create([
            'url' => $url,
            'original_name' => Str::afterLast(parse_url($url, PHP_URL_PATH) ?? '', '/') ?: null,
            'source' => 'url',
            'type' => 'image',
            'news_article_id' => $newsArticleId,
        ]);
    }

    private const IMAGE_ASPECT_OPTIONS = [
        'openai' => ['size' => '1536x1024', 'quality' => 'medium'],
        'gemini' => ['aspect_ratio' => '16:9'],
    ];

    public function generateWithAi(string $prompt, ?int $newsArticleId = null): Media
    {
        $provider = $this->resolveImageProvider();

        if (! $provider) {
            throw new RuntimeException('No hay un proveedor con soporte de imágenes configurado. Agrégalo y activalo para imágenes en Modelo de IA.');
        }

        $response = Prism::image()
            ->using($provider->provider, config("ai_catalog.{$provider->provider}.image_model"), [
                'api_key' => $provider->api_key,
            ])
            ->withClientOptions(['timeout' => 120])
            ->withProviderOptions(self::IMAGE_ASPECT_OPTIONS[$provider->provider] ?? [])
            ->withPrompt($prompt)
            ->generate();

        $image = $response->firstImage();
        $model = config("ai_catalog.{$provider->provider}.image_model");

        if ($image->hasBase64()) {
            $path = 'media/'.uniqid('ai-', true).'.png';
            Storage::disk('public')->put($path, base64_decode($image->base64));

            return Media::create([
                'url' => Storage::disk('public')->url($path),
                'original_name' => Str::limit($prompt, 60, ''),
                'source' => 'ai',
                'provider' => $provider->provider,
                'model' => $model,
                'type' => 'image',
                'news_article_id' => $newsArticleId,
            ]);
        }

        return Media::create([
            'url' => $image->url,
            'original_name' => Str::limit($prompt, 60, ''),
            'source' => 'ai',
            'provider' => $provider->provider,
            'model' => $model,
            'type' => 'image',
            'news_article_id' => $newsArticleId,
        ]);
    }

    private const AUDIO_VOICES = [
        'openai' => [
            'voice' => 'shimmer',
            'options' => [
                'response_format' => 'mp3',
                'instructions' => 'Habla como un/a locutor/a de noticias de entretenimiento: cálido, natural y con ritmo conversacional, con las pausas y la entonación de una persona real contando algo que le interesa. Nada de tono robótico, monótono o de lectura mecánica.',
            ],
        ],
        'elevenlabs' => [
            'voice' => 'jBlmi27XRORxjPquUeCh',
            'options' => [
                'model_id' => 'eleven_multilingual_v2',
                'voice_settings' => ['stability' => 0.5, 'similarity_boost' => 0.75],
            ],
        ],
    ];

    public function generateNarration(NewsArticle $newsArticle): Media
    {
        $provider = $this->resolveAudioProvider();

        if (! $provider) {
            throw new RuntimeException('No hay un proveedor con soporte de audio configurado. Agrégalo y activalo para audio en Modelo de IA.');
        }

        $voiceConfig = self::AUDIO_VOICES[$provider->provider] ?? ['voice' => null, 'options' => []];

        if (! $voiceConfig['voice']) {
            throw new RuntimeException("No hay una voz configurada para {$provider->provider}.");
        }

        $script = $this->buildNarrationScript($newsArticle);

        $response = Prism::audio()
            ->using($provider->provider, config("ai_catalog.{$provider->provider}.audio_model"), [
                'api_key' => $provider->api_key,
            ])
            ->withInput($script)
            ->withVoice($voiceConfig['voice'])
            ->withProviderOptions($voiceConfig['options'])
            ->asAudio();

        $path = 'audio/'.uniqid('narracion-', true).'.mp3';
        Storage::disk('public')->put($path, base64_decode($response->audio->base64));

        return Media::create([
            'url' => Storage::disk('public')->url($path),
            'original_name' => Str::limit($newsArticle->title, 60, ''),
            'source' => 'ai',
            'provider' => $provider->provider,
            'model' => config("ai_catalog.{$provider->provider}.audio_model"),
            'type' => 'audio',
            'news_article_id' => $newsArticle->id,
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

    private function buildNarrationScript(NewsArticle $newsArticle): string
    {
        $plainBody = trim(preg_replace('/\s+/', ' ', strip_tags((string) $newsArticle->body)) ?? '');

        $script = trim($newsArticle->title.". \n".($newsArticle->excerpt ?? '')." \n".$plainBody);

        return Str::limit($script, self::AUDIO_MAX_CHARS, '');
    }
}
