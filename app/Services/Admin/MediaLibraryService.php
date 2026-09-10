<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        Log::info('ai_usage.image', [
            'news_article_id' => $newsArticleId,
            'provider' => $provider->provider,
            'model' => $model,
            'usage' => $response->usage->toArray(),
        ]);

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

    public function download(Media $media): BinaryFileResponse|StreamedResponse
    {
        $filename = $this->downloadFilename($media);

        if (Str::startsWith($media->url, Storage::disk('public')->url(''))) {
            $path = Str::after($media->url, Storage::disk('public')->url(''));

            return Storage::disk('public')->download($path, $filename);
        }

        $response = Http::timeout(30)->get($media->url);

        if (! $response->successful()) {
            throw new RuntimeException('No se pudo descargar el archivo original.');
        }

        return new StreamedResponse(
            function () use ($response) {
                echo $response->body();
            },
            200,
            [
                'Content-Type' => $response->header('Content-Type') ?: 'application/octet-stream',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ],
        );
    }

    private function downloadFilename(Media $media): string
    {
        $extension = pathinfo(parse_url($media->url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION)
            ?: ($media->type === 'audio' ? 'mp3' : 'png');

        $base = $media->original_name
            ? Str::slug(Str::limit($media->original_name, 60, ''))
            : $media->type.'-'.$media->id;

        return "{$base}.{$extension}";
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

    /**
     * La generación de imagen con IA tarda hasta ~2.5 minutos (timeout del
     * job). Sin esto, si el admin cierra el diálogo o recarga la página
     * mientras se genera, no hay forma de saber que ya hay una en curso y
     * puede terminar disparando otra generación duplicada (gasto de API
     * doble por las dudas). Este lock por artículo evita eso: el
     * controller lo consulta antes de encolar un nuevo job, y el propio
     * job lo libera al terminar (ok o error).
     */
    public function activeGenerationRunId(int $newsArticleId): ?string
    {
        return Cache::get($this->generationLockKey($newsArticleId));
    }

    public function lockGeneration(int $newsArticleId, string $runId): void
    {
        // TTL bien por encima del timeout del job (150s) como red de
        // seguridad: si algo mata el worker a mitad de camino y el job
        // nunca libera el lock, no queda trabado para siempre.
        Cache::put($this->generationLockKey($newsArticleId), $runId, now()->addMinutes(5));
    }

    public function unlockGeneration(int $newsArticleId): void
    {
        Cache::forget($this->generationLockKey($newsArticleId));
    }

    private function generationLockKey(int $newsArticleId): string
    {
        return "media-generation:article:{$newsArticleId}";
    }
}
