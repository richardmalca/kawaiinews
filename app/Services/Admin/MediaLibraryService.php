<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\StorageSetting;
use App\Support\AiUsageLogger;
use App\Support\ArticleImagePromptBuilder;
use App\Support\MediaNaming;
use App\Support\RemoteStorage;
use App\Support\YoutubeVideo;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use Prism\Prism\ValueObjects\Media\Image;
use Prism\Prism\ValueObjects\Usage;
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

    public function generateWithAi(string $prompt, ?int $newsArticleId = null, ?string $referenceImageUrl = null): Media
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
            ->withPrompt($prompt, $referenceImageUrl ? [Image::fromUrl($referenceImageUrl)] : [])
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

    /**
     * Genera automáticamente la imagen de portada de un artículo recién
     * creado, usando la imagen del cluster de origen (si tiene) como
     * referencia visual — así la IA no arranca de cero con solo texto,
     * sino que sigue la composición/escena real de la noticia. No hace
     * nada si el artículo no tiene título/resumen/contenido todavía, o si
     * ya tiene una portada puesta (para no pisar algo que alguien haya
     * cargado a mano mientras el job esperaba en la cola).
     */
    public function generateFeaturedImage(NewsArticle $article): ?Media
    {
        // Al crear el artículo, featured_image arranca con la imagen tal
        // cual la trajo la fuente (ver NewsArticleService::createFromCluster)
        // — no es todavía una elección deliberada. Si sigue siendo esa
        // misma imagen (o está vacía), esto la reemplaza por la versión
        // generada con IA usándola de referencia. Si alguien ya la
        // cambió a mano por otra cosa, se respeta y no se toca.
        $fallbackImage = $article->newsCluster?->image_url;

        if (filled($article->featured_image) && $article->featured_image !== $fallbackImage) {
            return null;
        }

        // Sin foto de la fuente, la miniatura del tráiler de YouTube (si
        // el cluster tiene uno) sirve igual de referencia visual — mejor
        // eso que arrancar de cero solo con texto.
        $referenceImage = $fallbackImage ?: YoutubeVideo::thumbnailUrl($article->newsCluster?->video_url);

        $prompt = ArticleImagePromptBuilder::build($article, hasReference: filled($referenceImage));

        if (! $prompt) {
            return null;
        }

        $media = $this->generateWithAi($prompt, $article->id, $referenceImage);

        // Se vuelve a chequear acá (no solo al principio) por si alguien
        // cargó una portada a mano mientras la IA generaba la imagen,
        // que puede tardar hasta un par de minutos.
        $article->refresh();

        if (blank($article->featured_image) || $article->featured_image === $fallbackImage) {
            $article->update(['featured_image' => $media->url]);
        }

        return $media;
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
                'model_id' => 'eleven_turbo_v2_5',
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

        $script = $this->buildNarrationScript($newsArticle);
        $model = config("ai_catalog.{$provider->provider}.audio_model");

        $audioBase64 = $provider->provider === 'google-tts'
            ? $this->generateGoogleTtsAudio($this->buildNarrationSsml($newsArticle), $provider->api_key, $model)
            : $this->generateAudioWithPrism($provider->provider, $model, $provider->api_key, $script);

        // Google Cloud TTS cobra por carácter narrado, no por token — se
        // guarda igual la cantidad de caracteres como "prompt_tokens" para
        // que el estimado de costo del panel (AiCostEstimator) lo pueda
        // calcular con la misma fórmula que el resto, sin duplicarla.
        AiUsageLogger::record('audio', $provider->provider, $model, new Usage(mb_strlen($script), 0), $newsArticle);

        $disk = $this->mediaDisk();
        $path = MediaNaming::path('audio', 'mp3');
        $disk->put($path, base64_decode($audioBase64), 'public');

        return Media::create([
            'url' => $disk->url($path),
            'original_name' => Str::limit($newsArticle->title, 60, ''),
            'source' => 'ai',
            'provider' => $provider->provider,
            'model' => $model,
            'type' => 'audio',
            'news_article_id' => $newsArticle->id,
        ]);
    }

    private function generateAudioWithPrism(string $provider, string $model, ?string $apiKey, string $script): string
    {
        $voiceConfig = self::AUDIO_VOICES[$provider] ?? ['voice' => null, 'options' => []];

        if (! $voiceConfig['voice']) {
            throw new RuntimeException("No hay una voz configurada para {$provider}.");
        }

        $response = Prism::audio()
            ->using($provider, $model, ['api_key' => $apiKey])
            ->withInput($script)
            ->withVoice($voiceConfig['voice'])
            ->withProviderOptions($voiceConfig['options'])
            ->asAudio();

        return $response->audio->base64;
    }

    /**
     * Google Cloud Text-to-Speech no es un proveedor que Prism soporte
     * (solo habla con OpenAI y Gemini para audio), así que se llama
     * directo a su API REST — es simple, solo necesita la clave como
     * parámetro de consulta, nada de credenciales de service account.
     */
    private function generateGoogleTtsAudio(string $ssml, ?string $apiKey, string $voiceName): string
    {
        if (! $apiKey) {
            throw new RuntimeException('Falta la API key de Google Cloud Text-to-Speech.');
        }

        $response = Http::timeout(30)->post(
            "https://texttospeech.googleapis.com/v1/text:synthesize?key={$apiKey}",
            [
                'input' => ['ssml' => $ssml],
                'voice' => ['languageCode' => 'es-US', 'name' => $voiceName],
                'audioConfig' => ['audioEncoding' => 'MP3'],
            ]
        );

        if (! $response->successful()) {
            $message = $response->json('error.message') ?? $response->body();

            throw new RuntimeException("Google Cloud Text-to-Speech: {$message}");
        }

        $audioContent = $response->json('audioContent');

        if (! $audioContent) {
            throw new RuntimeException('Google Cloud Text-to-Speech no devolvió audio.');
        }

        return $audioContent;
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
        $plainBody = implode(' ', $this->narrationBlocks($newsArticle));

        return Str::limit($plainBody, self::AUDIO_MAX_CHARS, '');
    }

    /**
     * Igual que buildNarrationScript(), pero como SSML con una pausa
     * explícita entre bloques (<break time="650ms"/>) en vez de confiar en
     * que el punto solo alcance — para Google Cloud Text-to-Speech, que sí
     * soporta SSML a diferencia de los proveedores que pasan por Prism, un
     * punto normal de oración se lee con una pausa demasiado corta para
     * notarse como el corte real que hace falta entre un subtítulo y el
     * párrafo siguiente.
     */
    private function buildNarrationSsml(NewsArticle $newsArticle): string
    {
        $blocks = [];
        $length = 0;

        foreach ($this->narrationBlocks($newsArticle) as $block) {
            $length += mb_strlen($block) + 1;

            if ($length > self::AUDIO_MAX_CHARS) {
                break;
            }

            $blocks[] = $block;
        }

        $escaped = array_map(fn (string $block) => htmlspecialchars($block, ENT_XML1 | ENT_QUOTES, 'UTF-8'), $blocks);

        return '<speak>'.implode(' <break time="650ms"/> ', $escaped).'</speak>';
    }

    /**
     * Título, resumen y cuerpo (separado por sus bloques de HTML — <h3> de
     * subtítulo, <p> de párrafo, <li>, etc. — ANTES de sacarle las
     * etiquetas), cada uno con un punto final si no termina ya en uno. Sin
     * esto, strip_tags() + colapsar espacios deja el subtítulo pegado
     * directamente al párrafo siguiente ("Subtítulo El párrafo..."), sin
     * ninguna puntuación entre medio — y la voz de la narración lo lee
     * todo corrido, sin la pausa que sí hace al final de una oración.
     *
     * @return array<int, string>
     */
    private function narrationBlocks(NewsArticle $newsArticle): array
    {
        $withBreaks = preg_replace('/<\/(h[1-6]|p|li|blockquote)>/i', "$0\n", (string) $newsArticle->body) ?? (string) $newsArticle->body;
        $withBreaks = preg_replace('/<br\s*\/?>/i', "\n", $withBreaks) ?? $withBreaks;

        $blocks = array_merge(
            [$newsArticle->title, $newsArticle->excerpt ?? ''],
            preg_split('/\n+/', strip_tags($withBreaks)) ?: [],
        );

        return collect($blocks)
            ->map(fn (string $block) => trim(preg_replace('/\s+/', ' ', $block) ?? ''))
            ->filter()
            ->map(fn (string $block) => preg_match('/[.!?:]$/', $block) ? $block : "{$block}.")
            ->values()
            ->all();
    }

    /**
     * La generación de imagen o audio con IA tarda hasta ~2.5 minutos
     * (timeout del job). Sin esto, si el admin cierra el diálogo, recarga
     * la página o le da varias veces al botón mientras se genera, no hay
     * forma de saber que ya hay una en curso y puede terminar disparando
     * otra generación duplicada (gasto de API doble por las dudas). Este
     * lock por artículo y tipo de medio evita eso: el controller lo
     * consulta antes de encolar un nuevo job, y el propio job lo libera al
     * terminar (ok o error). Imagen y audio usan locks separados porque
     * son independientes entre sí — no hace falta que uno bloquee al otro.
     */
    public function activeGenerationRunId(int $newsArticleId, string $kind = 'image'): ?string
    {
        return Cache::get($this->generationLockKey($newsArticleId, $kind));
    }

    public function lockGeneration(int $newsArticleId, string $runId, string $kind = 'image'): void
    {
        // TTL bien por encima del timeout del job (150s) como red de
        // seguridad: si algo mata el worker a mitad de camino y el job
        // nunca libera el lock, no queda trabado para siempre.
        Cache::put($this->generationLockKey($newsArticleId, $kind), $runId, now()->addMinutes(5));
    }

    public function unlockGeneration(int $newsArticleId, string $kind = 'image'): void
    {
        Cache::forget($this->generationLockKey($newsArticleId, $kind));
    }

    private function generationLockKey(int $newsArticleId, string $kind): string
    {
        return "media-generation:{$kind}:article:{$newsArticleId}";
    }
}
