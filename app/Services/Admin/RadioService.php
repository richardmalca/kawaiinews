<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\RadioQueueItem;
use App\Models\RadioTrack;
use App\Models\StorageSetting;
use App\Support\AiUsageLogger;
use App\Support\MediaNaming;
use App\Support\Mp3Duration;
use App\Support\RemoteStorage;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Facades\Prism;
use Throwable;

/**
 * Arma la cola de "KawaiiRadio": música libre de derechos (subida a mano
 * por el admin) intercalada con noticias ya narradas, presentadas por un
 * DJ con voz de IA. La cola se reconstruye entera cada tanto (ver
 * BuildRadioQueueCommand) y se sirve tal cual al reproductor público — la
 * IA nunca se llama por oyente, solo al armar la cola, así el costo no
 * escala con la cantidad de gente escuchando.
 */
class RadioService
{
    /**
     * Cuántas noticias entran en cada vuelta de la cola. Cada una suma un
     * segmento de música antes, así que el total de items es el doble
     * (música + noticia, música + noticia...).
     */
    private const ARTICLES_PER_QUEUE = 8;

    /**
     * Cada cuántos pares música+noticia se intercala una frase suelta del
     * DJ (saludo, dato random, invitación a seguir el sitio) — le da vida
     * a la radio sin que sea siempre "una noticia atrás de otra".
     */
    private const FILLER_EVERY_N_PAIRS = 2;

    private const FILLER_PROMPTS = [
        'Saludá a los oyentes de KawaiiRadio con una frase corta y copada, como arrancando un segmento — sin mencionar ninguna noticia en particular.',
        'Contá un dato curioso breve (una sola oración) sobre anime, manga o videojuegos, con tono de locutor de radio.',
        'Invitá a los oyentes, en una sola oración con onda, a seguir explorando KawaiiNews para más noticias de anime y manga.',
        'Hacé una transición corta y divertida entre canciones, como diría un DJ de radio real, sin mencionar ninguna canción específica.',
    ];

    private function disk(): Filesystem
    {
        $storageSettings = StorageSetting::current();

        if ($storageSettings->active_for_media && $storageSettings->isConfigured()) {
            return RemoteStorage::disk($storageSettings);
        }

        return Storage::disk('public');
    }

    public function addTrack(UploadedFile $file, string $title, ?string $artist): RadioTrack
    {
        $contents = $file->get();
        $path = MediaNaming::path('audio', $file->getClientOriginalExtension() ?: $file->extension() ?: 'mp3');
        $this->disk()->put($path, $contents, 'public');

        return RadioTrack::create([
            'title' => $title,
            'artist' => $artist,
            'url' => $this->disk()->url($path),
            'duration_seconds' => Mp3Duration::seconds($contents),
        ]);
    }

    public function removeTrack(RadioTrack $track): void
    {
        $track->delete();
    }

    /**
     * Reconstruye la cola completa: borra la anterior y arma una nueva,
     * alternando música activa (en orden aleatorio) con las últimas
     * noticias publicadas que ya tengan narración lista. A cada noticia
     * le genera (o reutiliza, si ya la tenía) una frase corta del DJ que
     * la presenta antes de reproducirla.
     *
     * @return array{queued: int, skipped_no_audio: int, skipped_no_music: bool}
     */
    public function buildQueue(): array
    {
        $tracks = RadioTrack::where('active', true)->get();

        if ($tracks->isEmpty()) {
            return ['queued' => 0, 'skipped_no_audio' => 0, 'skipped_no_music' => true];
        }

        $articles = NewsArticle::where('status', 'published')
            ->whereNotNull('audio_url')
            ->orderByDesc('published_at')
            ->limit(self::ARTICLES_PER_QUEUE)
            ->get();

        $skippedNoAudio = NewsArticle::where('status', 'published')
            ->whereNull('audio_url')
            ->orderByDesc('published_at')
            ->limit(self::ARTICLES_PER_QUEUE)
            ->count();

        $items = [];
        $shuffledTracks = $tracks->shuffle();

        foreach ($articles as $index => $article) {
            if ($index > 0 && $index % self::FILLER_EVERY_N_PAIRS === 0) {
                $filler = $this->generateFillerItem();

                if ($filler) {
                    $items[] = $filler;
                }
            }

            $track = $shuffledTracks[$index % $shuffledTracks->count()];

            $items[] = [
                'type' => 'music',
                'radio_track_id' => $track->id,
                'news_article_id' => null,
                'title' => $track->title,
                'audio_url' => $track->url,
                'duration_seconds' => $this->ensureTrackDuration($track),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $this->ensureDjIntro($article);
            $article->refresh();

            // En la radio solo va la presentación corta del DJ, nunca la
            // noticia narrada completa (eso queda para el reproductor de
            // audio del artículo en sí, no para la radio de fondo). Si
            // todavía no tiene presentación generada, se cae a la
            // narración completa como respaldo — mejor eso que dejar la
            // noticia afuera de la rotación.
            $usingDjIntro = filled($article->dj_intro_url);

            $items[] = [
                'type' => 'article',
                'radio_track_id' => null,
                'news_article_id' => $article->id,
                'title' => $article->title,
                'audio_url' => $usingDjIntro ? $article->dj_intro_url : $article->audio_url,
                'duration_seconds' => $usingDjIntro
                    ? $this->ensureDjIntroDuration($article)
                    : $this->ensureAudioDuration($article),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $items = collect($items)
            ->values()
            ->map(fn (array $item, int $i) => [...$item, 'position' => $i + 1])
            ->all();

        DB::transaction(function () use ($items) {
            RadioQueueItem::query()->delete();

            if ($items !== []) {
                RadioQueueItem::insert($items);
            }
        });

        return ['queued' => count($items), 'skipped_no_audio' => $skippedNoAudio, 'skipped_no_music' => false];
    }

    /**
     * La narración del artículo la genera MediaLibraryService (fuera de
     * este servicio) y nunca guardó cuánto dura — sin esa duración, el
     * reproductor no tiene forma de saber cuándo pasar al siguiente item
     * de la cola. Se calcula una sola vez (bajando el mp3 y leyendo su
     * bitrate) y se cachea en el propio artículo, igual que dj_intro_url.
     */
    private function ensureAudioDuration(NewsArticle $article): ?int
    {
        if (! $article->audio_url) {
            return null;
        }

        return $this->ensureMp3DurationCached(
            $article->audio_url,
            $article->audio_duration_seconds,
            fn (int $duration) => $article->update(['audio_duration_seconds' => $duration]),
        );
    }

    /**
     * Backfill para presentaciones del DJ que ya existían antes de que se
     * empezara a guardar su duración (dj_intro_duration_seconds) — sin
     * esto, cualquier noticia con presentación generada antes de este
     * cambio se quedaría con duration null para siempre.
     */
    private function ensureDjIntroDuration(NewsArticle $article): ?int
    {
        if (! $article->dj_intro_url) {
            return null;
        }

        return $this->ensureMp3DurationCached(
            $article->dj_intro_url,
            $article->dj_intro_duration_seconds,
            fn (int $duration) => $article->update(['dj_intro_duration_seconds' => $duration]),
        );
    }

    /**
     * Mismo backfill para pistas de música subidas antes de que
     * addTrack() empezara a calcular la duración sola.
     */
    private function ensureTrackDuration(RadioTrack $track): ?int
    {
        return $this->ensureMp3DurationCached(
            $track->url,
            $track->duration_seconds,
            fn (int $duration) => $track->update(['duration_seconds' => $duration]),
        );
    }

    /**
     * Descarga (una sola vez, después queda cacheado por quien llama) y
     * calcula la duración de un mp3 ya subido. 0 se guarda como "ya lo
     * intenté y no se pudo calcular", para no volver a bajar el archivo
     * en cada rearmado de cola — null sigue significando "todavía no se
     * intentó". Al reproductor nunca se le manda 0 (lo trataría como "ya
     * terminó"), solo null o el valor real.
     */
    private function ensureMp3DurationCached(string $url, ?int $current, callable $persist): ?int
    {
        if ($current !== null) {
            return $current ?: null;
        }

        try {
            $contents = Http::timeout(15)->get($url)->body();
        } catch (Throwable) {
            return null;
        }

        $duration = Mp3Duration::seconds($contents);
        $persist($duration ?? 0);

        return $duration;
    }

    /**
     * Genera una vez (y cachea para siempre en el propio artículo, igual
     * que featured_image/audio_url) una frase corta del DJ presentando la
     * noticia — no se regenera en cada rearmado de cola, solo la primera
     * vez que ese artículo entra en rotación.
     */
    private function ensureDjIntro(NewsArticle $article): void
    {
        if (filled($article->dj_intro_url)) {
            return;
        }

        $script = $this->generateDjScript($article);

        if (! $script) {
            return;
        }

        $audioBase64 = $this->generateDjAudio($script);

        if (! $audioBase64) {
            return;
        }

        $decoded = base64_decode($audioBase64);
        $path = MediaNaming::path('audio', 'mp3');
        $this->disk()->put($path, $decoded, 'public');

        // ?? 0 con el mismo criterio que ensureMp3DurationCached: si no se
        // pudo leer la duración, se guarda 0 ("ya lo intenté") en vez de
        // null ("todavía no lo intenté") — si no, el backfill de
        // ensureDjIntroDuration la volvería a intentar bajar en cada
        // rearmado de cola sin parar nunca.
        $article->update([
            'dj_intro_url' => $this->disk()->url($path),
            'dj_intro_duration_seconds' => Mp3Duration::seconds($decoded) ?? 0,
        ]);
    }

    /**
     * A diferencia de la presentación de una noticia (ensureDjIntro), esto
     * no se cachea en ningún lado — se genera de nuevo en cada rearmado de
     * cola (cada 2h), así que el costo sigue siendo chico y acotado, nunca
     * por oyente.
     *
     * @return array{type: string, radio_track_id: null, news_article_id: null, title: string, audio_url: string, duration_seconds: int|null, created_at: Carbon, updated_at: Carbon}|null
     */
    private function generateFillerItem(): ?array
    {
        $script = $this->generateFillerScript();

        if (! $script) {
            return null;
        }

        $audioBase64 = $this->generateDjAudio($script);

        if (! $audioBase64) {
            return null;
        }

        $decoded = base64_decode($audioBase64);
        $path = MediaNaming::path('audio', 'mp3');
        $this->disk()->put($path, $decoded, 'public');

        return [
            'type' => 'filler',
            'radio_track_id' => null,
            'news_article_id' => null,
            'title' => 'El DJ de KawaiiRadio',
            'audio_url' => $this->disk()->url($path),
            'duration_seconds' => Mp3Duration::seconds($decoded),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function generateFillerScript(): ?string
    {
        $provider = AiProvider::where('is_active', true)->first();

        if (! $provider || ! $provider->hasApiKey()) {
            return null;
        }

        $instruction = self::FILLER_PROMPTS[array_rand(self::FILLER_PROMPTS)];

        $prompt = <<<PROMPT
            Sos el DJ de KawaiiRadio, una radio online de anime, manga y videojuegos.

            {$instruction}

            Devolvé solo la frase del DJ, sin comillas ni texto adicional.
            PROMPT;

        try {
            $response = Prism::text()
                ->using($provider->provider, $provider->default_model, [
                    'api_key' => $provider->api_key,
                ])
                ->withPrompt($prompt)
                ->asText();

            AiUsageLogger::record('radio_dj', $provider->provider, $provider->default_model, $response->usage);

            return trim($response->text) ?: null;
        } catch (Throwable) {
            return null;
        }
    }

    private function generateDjScript(NewsArticle $article): ?string
    {
        $provider = AiProvider::where('is_active', true)->first();

        if (! $provider || ! $provider->hasApiKey()) {
            return null;
        }

        $prompt = <<<PROMPT
            Sos el DJ de KawaiiRadio, una radio online de anime, manga y videojuegos. Presentá esta noticia en UNA sola oración corta, tono cercano y entusiasta, como lo haría un locutor de radio antes de pasar una nota (no la leas completa, es solo la presentación).

            Título: {$article->title}
            Resumen: {$article->excerpt}

            Devolvé solo la frase del DJ, sin comillas ni texto adicional.
            PROMPT;

        try {
            $response = Prism::text()
                ->using($provider->provider, $provider->default_model, [
                    'api_key' => $provider->api_key,
                ])
                ->withPrompt($prompt)
                ->asText();

            AiUsageLogger::record('radio_dj', $provider->provider, $provider->default_model, $response->usage, $article);

            return trim($response->text) ?: null;
        } catch (Throwable) {
            return null;
        }
    }

    private function generateDjAudio(string $script): ?string
    {
        $provider = AiProvider::where('is_active_for_audio', true)->whereNotNull('api_key')->first();

        if (! $provider) {
            return null;
        }

        try {
            if ($provider->provider === 'google-tts') {
                // Sin esto, el audio del DJ terminaba justo al final de la
                // frase y la siguiente pista arrancaba pegada, sin ningún
                // respiro — igual que pasaba con la narración de artículos
                // antes de agregarle la pausa SSML (ver
                // MediaLibraryService::buildNarrationSsml).
                $escaped = htmlspecialchars($script, ENT_XML1 | ENT_QUOTES, 'UTF-8');
                $ssml = "<speak>{$escaped} <break time=\"700ms\"/></speak>";

                $response = Http::timeout(30)->post(
                    "https://texttospeech.googleapis.com/v1/text:synthesize?key={$provider->api_key}",
                    [
                        'input' => ['ssml' => $ssml],
                        'voice' => ['languageCode' => 'es-US', 'name' => 'es-US-Wavenet-B'],
                        'audioConfig' => ['audioEncoding' => 'MP3'],
                    ]
                );

                return $response->successful() ? $response->json('audioContent') : null;
            }

            $response = Prism::audio()
                ->using($provider->provider, config("ai_catalog.{$provider->provider}.audio_model"), ['api_key' => $provider->api_key])
                ->withInput($script)
                ->withVoice($provider->provider === 'elevenlabs' ? 'jBlmi27XRORxjPquUeCh' : 'shimmer')
                ->asAudio();

            return $response->audio->base64;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return Collection<int, RadioQueueItem>
     */
    public function currentQueue(): Collection
    {
        return RadioQueueItem::with(['newsArticle', 'radioTrack'])->orderBy('position')->get();
    }
}
