<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use Prism\Prism\Facades\Prism;
use Throwable;

class AiProviderService
{
    /**
     * @param  array{label: string, default_model: string, api_key?: string|null}  $data
     */
    public function save(AiProvider $aiProvider, array $data): AiProvider
    {
        $aiProvider->fill([
            'label' => $data['label'],
            'default_model' => $this->resolveDefaultModel($aiProvider->provider, $data['default_model'] ?? null),
        ]);

        if (filled($data['api_key'] ?? null)) {
            $aiProvider->api_key = trim($data['api_key']);
        }

        $aiProvider->save();

        return $aiProvider;
    }

    private const CAPABILITY_COLUMNS = [
        'text' => 'is_active',
        'image' => 'is_active_for_images',
        'audio' => 'is_active_for_audio',
    ];

    public function activate(AiProvider $aiProvider, string $capability = 'text'): void
    {
        $column = self::CAPABILITY_COLUMNS[$capability] ?? self::CAPABILITY_COLUMNS['text'];

        if ($capability === 'text' && ! $aiProvider->supportsText()) {
            return;
        }

        if ($capability === 'image' && ! $aiProvider->supportsImages()) {
            return;
        }

        if ($capability === 'audio' && ! $aiProvider->supportsAudio()) {
            return;
        }

        AiProvider::where('id', '!=', $aiProvider->id)->update([$column => false]);

        $aiProvider->update([$column => true]);
    }

    private function resolveDefaultModel(string $provider, ?string $submitted): string
    {
        if (filled($submitted)) {
            return $submitted;
        }

        return config("ai_catalog.{$provider}.audio_model")
            ?? config("ai_catalog.{$provider}.image_model")
            ?? $provider;
    }

    public function delete(AiProvider $aiProvider): void
    {
        $aiProvider->delete();
    }

    /**
     * @param  array{provider: string, label: string, default_model: string, api_key?: string|null}  $data
     */
    public function createFromCatalog(array $data): AiProvider
    {
        $supportsText = filled(config("ai_catalog.{$data['provider']}.models"));

        $aiProvider = AiProvider::create([
            'provider' => $data['provider'],
            'label' => $data['label'],
            'default_model' => $this->resolveDefaultModel($data['provider'], $data['default_model'] ?? null),
            'is_active' => $supportsText && AiProvider::query()->doesntExist(),
        ]);

        if (filled($data['api_key'] ?? null)) {
            $aiProvider->update(['api_key' => trim($data['api_key'])]);
        }

        return $aiProvider;
    }

    /**
     * @return array<int, array{
     *     provider: string,
     *     label: string,
     *     models: array<int, string>,
     *     configured: bool,
     *     provider_id: int|null,
     *     supports_text: bool,
     *     supports_image: bool,
     *     supports_audio: bool,
     * }>
     */
    public function catalog(): array
    {
        $configured = AiProvider::pluck('id', 'provider');

        return collect(config('ai_catalog'))
            ->map(fn (array $entry, string $providerKey) => [
                'provider' => $providerKey,
                'label' => $entry['label'],
                'models' => $entry['models'],
                'configured' => $configured->has($providerKey),
                'provider_id' => $configured->get($providerKey),
                'supports_text' => filled($entry['models'] ?? []),
                'supports_image' => filled($entry['image_model'] ?? null),
                'supports_audio' => filled($entry['audio_model'] ?? null),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     total: int,
     *     configured: int,
     *     models: array<int, string>,
     *     active: array{label: string, provider: string, model: string}|null,
     *     active_image: array{label: string, provider: string}|null,
     *     active_audio: array{label: string, provider: string}|null,
     * }
     */
    public function summary(): array
    {
        $providers = AiProvider::all();
        $active = $providers->firstWhere('is_active', true);
        $activeImage = $providers->firstWhere('is_active_for_images', true);
        $activeAudio = $providers->firstWhere('is_active_for_audio', true);

        return [
            'total' => $providers->count(),
            'configured' => $providers->filter->hasApiKey()->count(),
            'models' => $providers->pluck('default_model')->unique()->values()->all(),
            'active' => $active ? [
                'label' => $active->label,
                'provider' => $active->provider,
                'model' => $active->default_model,
            ] : null,
            'active_image' => $activeImage ? [
                'label' => $activeImage->label,
                'provider' => $activeImage->provider,
            ] : null,
            'active_audio' => $activeAudio ? [
                'label' => $activeAudio->label,
                'provider' => $activeAudio->provider,
            ] : null,
        ];
    }

    /**
     * @return array{success: bool, message: string}
     */
    public function testConnection(AiProvider $aiProvider): array
    {
        if (! $aiProvider->hasApiKey()) {
            return [
                'success' => false,
                'message' => 'Agrega una API key antes de probar la conexión.',
            ];
        }

        if (! $aiProvider->supportsText()) {
            return [
                'success' => false,
                'message' => 'Este proveedor no genera texto (solo imagen/audio), no hay una conexión de texto que probar acá.',
            ];
        }

        try {
            $response = Prism::text()
                ->using($aiProvider->provider, $aiProvider->default_model, [
                    'api_key' => $aiProvider->api_key,
                ])
                ->withPrompt('Responde únicamente con la palabra: ok')
                ->asText();

            $aiProvider->update(['last_verified_at' => now()]);

            return [
                'success' => true,
                'message' => "Conexión exitosa. Respuesta del modelo: \"{$response->text}\"",
            ];
        } catch (Throwable $exception) {
            return [
                'success' => false,
                'message' => 'No se pudo conectar: '.$exception->getMessage(),
            ];
        }
    }
}
