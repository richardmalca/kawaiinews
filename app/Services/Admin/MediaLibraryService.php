<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\StorageSetting;
use App\Support\AiUsageLogger;
use App\Support\MediaNaming;
use App\Support\RemoteStorage;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class MediaLibraryService
{
    private const AUDIO_MAX_CHARS = 3500;

    public function __construct(private readonly ImageOptimizerService $imageOptimizer) {}

    /**
     * Disco donde se guardan los archivos nuevos: Wasabi/S3 si está
     * configurado y activado para medios en Configuración de almacenamiento,
     * el disco local ("public") si no. Los archivos que ya existían en el
     * otro disco se siguen sirviendo/borrando bien igual (ver diskForUrl()).
     */
    private function mediaDisk(): Filesystem
    {
        $storageSettings = StorageSetting::current();

        if ($storageSettings->active_for_media && $storageSettings->isConfigured()) {
            return RemoteStorage::disk($storageSettings);
        }

        return Storage::disk('public');
    }

    /**
     * Encuentra en qué disco (local o remoto) vive de verdad una URL ya
     * guardada, sin asumir que es el disco actualmente activo — así,
     * migrar de local a S3 (o viceversa) no rompe los archivos que ya
     * estaban en el otro.
     *
     * @return array{0: Filesystem, 1: string}|null
     */
    private function diskForUrl(string $url): ?array
    {
        $localDisk = Storage::disk('public');
        $localPrefix = $localDisk->url('');

        if (Str::startsWith($url, $localPrefix)) {
            return [$localDisk, Str::after($url, $localPrefix)];
        }

        $storageSettings = StorageSetting::current();

        if ($storageSettings->isConfigured()) {
            $remoteDisk = RemoteStorage::disk($storageSettings);
            $remotePrefix = $remoteDisk->url('');

            if (Str::startsWith($url, $remotePrefix)) {
                return [$remoteDisk, Str::after($url, $remotePrefix)];
            }
        }

        return null;
    }

    /**
     * Cuántos archivos de imagen/audio hay guardados en este servidor y
     * cuántos en el almacenamiento externo, para mostrarle al admin qué
     * tiene dónde antes de ofrecerle mover algo.
     *
     * @return array{local: int, remote: int}
     */
    public function countByLocation(): array
    {
        $localPrefix = Storage::disk('public')->url('');
        $local = 0;
        $remote = 0;

        $storageSettings = StorageSetting::current();
        $remotePrefix = $storageSettings->isConfigured()
            ? RemoteStorage::disk($storageSettings)->url('')
            : null;

        foreach (Media::whereIn('type', ['image', 'audio'])->pluck('url') as $url) {
            if (Str::startsWith($url, $localPrefix)) {
                $local++;
            } elseif ($remotePrefix && Str::startsWith($url, $remotePrefix)) {
                $remote++;
            }
        }

        return ['local' => $local, 'remote' => $remote];
    }

    /**
     * Mueve todos los archivos de imagen y audio guardados de un lugar al
     * otro (de este servidor al almacenamiento externo, o al revés),
     * actualizando el link guardado de cada uno para que siga
     * funcionando. Los que ya estén en el destino se cuentan aparte, no
     * se tocan de nuevo.
     *
     * De paso, cualquier imagen que todavía no esté en WebP (subida antes
     * de tener esta optimización) se convierte en el momento — así con un
     * solo traslado quedan al día tanto la ubicación como el peso del
     * archivo, sin tener que hacerlo dos veces.
     *
     * @return array{moved: int, already_there: int, failed: int, optimized: int}
     */
    public function migrateAll(string $direction): array
    {
        $storageSettings = StorageSetting::current();

        if (! $storageSettings->isConfigured()) {
            throw new RuntimeException('Todavía no cargaste los datos del almacenamiento externo.');
        }

        $targetDisk = $direction === 'remote' ? RemoteStorage::disk($storageSettings) : Storage::disk('public');
        $targetPrefix = $targetDisk->url('');

        $moved = 0;
        $alreadyThere = 0;
        $failed = 0;
        $optimized = 0;

        foreach (Media::whereIn('type', ['image', 'audio'])->cursor() as $media) {
            if (Str::startsWith($media->url, $targetPrefix)) {
                $alreadyThere++;

                continue;
            }

            $resolved = $this->diskForUrl($media->url);

            if (! $resolved) {
                // No es un archivo nuestro (por ejemplo, una imagen de IA
                // que se guardó como un link externo) — no hay nada que
                // mover acá, no cuenta como un error.
                continue;
            }

            [$sourceDisk, $originalPath] = $resolved;

            try {
                [$contents, $newPath, $wasOptimized] = $this->prepareForStorage($media, $sourceDisk, $originalPath);

                $targetDisk->put($newPath, $contents, 'public');
                $sourceDisk->delete($originalPath);
                $media->update(['url' => $targetDisk->url($newPath)]);

                $moved++;

                if ($wasOptimized) {
                    $optimized++;
                }
            } catch (Throwable) {
                $failed++;
            }
        }

        return ['moved' => $moved, 'already_there' => $alreadyThere, 'failed' => $failed, 'optimized' => $optimized];
    }

    /**
     * Pone al día, en el mismo lugar donde ya está cada archivo, el
     * nombre unificado (y de paso lo optimiza si todavía no lo estaba).
     * Para los que ya estaban subidos antes de tener esta estructura de
     * nombres, así no hace falta moverlos de servidor para arreglarlos.
     *
     * @return array{renamed: int, already_ok: int, failed: int, optimized: int}
     */
    public function renameAll(): array
    {
        $renamed = 0;
        $alreadyOk = 0;
        $failed = 0;
        $optimized = 0;

        foreach (Media::whereIn('type', ['image', 'audio'])->cursor() as $media) {
            $resolved = $this->diskForUrl($media->url);

            if (! $resolved) {
                continue;
            }

            [$disk, $originalPath] = $resolved;

            try {
                [$contents, $newPath, $wasOptimized] = $this->prepareForStorage($media, $disk, $originalPath);

                if ($newPath === $originalPath && ! $wasOptimized) {
                    $alreadyOk++;

                    continue;
                }

                $disk->put($newPath, $contents, 'public');
                $disk->delete($originalPath);
                $media->update(['url' => $disk->url($newPath)]);

                $renamed++;

                if ($wasOptimized) {
                    $optimized++;
                }
            } catch (Throwable) {
                $failed++;
            }
        }

        return ['renamed' => $renamed, 'already_ok' => $alreadyOk, 'failed' => $failed, 'optimized' => $optimized];
    }

    /**
     * Lee un archivo existente, lo optimiza si hace falta (imagen no
     * webp) y calcula su nombre con la estructura unificada, sin
     * importar en qué disco vaya a quedar guardado.
     *
     * @return array{0: string, 1: string, 2: bool} contenido, nueva ruta, si se optimizó
     */
    private function prepareForStorage(Media $media, Filesystem $sourceDisk, string $originalPath): array
    {
        $contents = $sourceDisk->get($originalPath);
        $extension = pathinfo($originalPath, PATHINFO_EXTENSION) ?: ($media->type === 'audio' ? 'mp3' : 'png');
        $wasOptimized = false;

        if ($media->type === 'image' && $extension !== 'webp') {
            $webp = $this->imageOptimizer->optimize($contents, $sourceDisk->mimeType($originalPath) ?: 'image/jpeg');

            if ($webp !== null) {
                $contents = $webp;
                $extension = 'webp';
                $wasOptimized = true;
            }
        }

        $newPath = MediaNaming::path($media->type, $extension);

        return [$contents, $newPath, $wasOptimized];
    }

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
        $disk = $this->mediaDisk();
        $optimized = $this->imageOptimizer->optimize(file_get_contents($file->getRealPath()), $file->getMimeType());

        if ($optimized !== null) {
            $path = MediaNaming::path('image', 'webp');
            $disk->put($path, $optimized, 'public');
        } else {
            // GIF (para no perder la animación) u otro caso que el
            // optimizador no supo procesar: se guarda tal cual llegó, pero
            // con el mismo esquema de nombre que todo lo demás.
            $path = MediaNaming::path('image', $file->getClientOriginalExtension() ?: $file->extension() ?: 'gif');
            $disk->putFileAs(dirname($path), $file, basename($path), 'public');
        }

        return Media::create([
            'url' => $disk->url($path),
            'original_name' => $file->getClientOriginalName(),
            'source' => 'upload',
            'type' => 'image',
            'news_article_id' => $newsArticleId,
        ]);
    }

    public function storeAudioUpload(UploadedFile $file, ?int $newsArticleId = null): Media
    {
        $disk = $this->mediaDisk();
        $path = MediaNaming::path('audio', $file->getClientOriginalExtension() ?: $file->extension() ?: 'mp3');
        $disk->putFileAs(dirname($path), $file, basename($path), 'public');

        return Media::create([
            'url' => $disk->url($path),
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

        AiUsageLogger::record('image', $provider->provider, $model, $response->usage);

        if ($image->hasBase64()) {
            $disk = $this->mediaDisk();
            $decoded = base64_decode($image->base64);
            $optimized = $this->imageOptimizer->optimize($decoded, 'image/png');
            $path = MediaNaming::path('image', $optimized !== null ? 'webp' : 'png');
            $disk->put($path, $optimized ?? $decoded, 'public');

            return Media::create([
                'url' => $disk->url($path),
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

        $disk = $this->mediaDisk();
        $path = MediaNaming::path('audio', 'mp3');
        $disk->put($path, base64_decode($response->audio->base64), 'public');

        return Media::create([
            'url' => $disk->url($path),
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

        if ($resolved = $this->diskForUrl($media->url)) {
            [$disk, $path] = $resolved;

            return $disk->download($path, $filename);
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
        if ($resolved = $this->diskForUrl($media->url)) {
            [$disk, $path] = $resolved;
            $disk->delete($path);
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
