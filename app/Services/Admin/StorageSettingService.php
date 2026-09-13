<?php

namespace App\Services\Admin;

use App\Models\StorageSetting;
use App\Support\RemoteStorage;
use Throwable;

class StorageSettingService
{
    /**
     * @param  array{access_key: string, secret_key?: string|null, bucket: string, region: ?string, endpoint: string, use_path_style_endpoint: bool, public_url: ?string}  $data
     */
    public function update(StorageSetting $settings, array $data): StorageSetting
    {
        $settings->fill([
            'access_key' => $data['access_key'],
            'bucket' => $data['bucket'],
            'region' => $data['region'] ?: 'us-east-1',
            'endpoint' => $data['endpoint'],
            'use_path_style_endpoint' => $data['use_path_style_endpoint'] ?? true,
            'public_url' => $data['public_url'] ?? null,
        ]);

        // Igual que la api_key de un proveedor de IA: si no mandaron una
        // secret key nueva, se conserva la que ya había (el campo llega
        // vacío a propósito para no reenviar/mostrar la actual).
        if (filled($data['secret_key'] ?? null)) {
            $settings->secret_key = trim($data['secret_key']);
        }

        $settings->save();

        return $settings;
    }

    public function setActiveForMedia(StorageSetting $settings, bool $active): StorageSetting
    {
        $settings->update(['active_for_media' => $active && $settings->isConfigured()]);

        return $settings;
    }

    public function setActiveForBackups(StorageSetting $settings, bool $active): StorageSetting
    {
        $settings->update(['active_for_backups' => $active && $settings->isConfigured()]);

        return $settings;
    }

    /**
     * @return array{success: bool, message: string}
     */
    public function testConnection(StorageSetting $settings): array
    {
        if (! $settings->isConfigured()) {
            return [
                'success' => false,
                'message' => 'Completá access key, secret key, bucket y endpoint antes de probar.',
            ];
        }

        $testPath = 'kawaiinews-test-'.uniqid().'.txt';

        try {
            $disk = RemoteStorage::disk($settings);
            $disk->put($testPath, 'ok', 'public');
            $contents = $disk->get($testPath);
            $disk->delete($testPath);

            if ($contents !== 'ok') {
                return ['success' => false, 'message' => 'Se pudo escribir pero el contenido leído no coincide — revisá el bucket.'];
            }

            $settings->update(['last_verified_at' => now()]);

            return ['success' => true, 'message' => 'Conexión exitosa: se pudo escribir, leer y borrar un archivo de prueba en el bucket.'];
        } catch (Throwable $exception) {
            return ['success' => false, 'message' => 'No se pudo conectar: '.$exception->getMessage()];
        }
    }
}
