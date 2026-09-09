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
            'default_model' => $data['default_model'],
        ]);

        if (filled($data['api_key'] ?? null)) {
            $aiProvider->api_key = trim($data['api_key']);
        }

        $aiProvider->save();

        return $aiProvider;
    }

    public function activate(AiProvider $aiProvider): void
    {
        AiProvider::where('id', '!=', $aiProvider->id)->update(['is_active' => false]);

        $aiProvider->update(['is_active' => true]);
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
        $aiProvider = AiProvider::create([
            'provider' => $data['provider'],
            'label' => $data['label'],
            'default_model' => $data['default_model'],
            'is_active' => AiProvider::query()->doesntExist(),
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
     * }
     */
    public function summary(): array
    {
        $providers = AiProvider::all();
        $active = $providers->firstWhere('is_active', true);

        return [
            'total' => $providers->count(),
            'configured' => $providers->filter->hasApiKey()->count(),
            'models' => $providers->pluck('default_model')->unique()->values()->all(),
            'active' => $active ? [
                'label' => $active->label,
                'provider' => $active->provider,
                'model' => $active->default_model,
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
