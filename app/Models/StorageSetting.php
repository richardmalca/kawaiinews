<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

/**
 * @property int $id
 * @property string|null $access_key
 * @property string|null $secret_key
 * @property string|null $bucket
 * @property string|null $region
 * @property string|null $endpoint
 * @property bool $use_path_style_endpoint
 * @property string|null $public_url
 * @property bool $active_for_media
 * @property bool $active_for_backups
 * @property Carbon|null $last_verified_at
 */
#[Fillable(['access_key', 'secret_key', 'bucket', 'region', 'endpoint', 'use_path_style_endpoint', 'public_url', 'active_for_media', 'active_for_backups', 'last_verified_at'])]
#[Hidden(['secret_key'])]
class StorageSetting extends Model
{
    private const CACHE_KEY = 'storage-settings:singleton';

    protected function casts(): array
    {
        return [
            'use_path_style_endpoint' => 'boolean',
            'active_for_media' => 'boolean',
            'active_for_backups' => 'boolean',
            'last_verified_at' => 'datetime',
        ];
    }

    /**
     * Igual que el cast `encrypted` de Eloquent, salvo que un valor que no
     * se puede desencriptar (ej. una fila que llegó de otro entorno con
     * distinta APP_KEY) se trata como "sin key" en vez de tirar
     * DecryptException y romper toda la página — mismo criterio que
     * AiProvider::apiKey().
     */
    protected function secretKey(): Attribute
    {
        return Attribute::make(
            get: function (?string $value) {
                if ($value === null) {
                    return null;
                }

                try {
                    return Crypt::decryptString($value);
                } catch (DecryptException) {
                    return null;
                }
            },
            set: fn (?string $value) => $value === null ? null : Crypt::encryptString($value),
        );
    }

    public static function current(): self
    {
        $attributes = Cache::rememberForever(self::CACHE_KEY, function () {
            $model = self::query()->firstOrCreate(['id' => 1]);

            // firstOrCreate() no trae los defaults que aplica la base al
            // insertar (ej. active_for_media => false): el modelo en
            // memoria solo tiene los atributos que se pasaron explícitos.
            // fresh() vuelve a leer la fila ya insertada, con todo.
            return $model->wasRecentlyCreated ? $model->fresh()->getAttributes() : $model->getAttributes();
        });

        $model = new self;
        $model->setRawAttributes($attributes, true);
        $model->exists = true;

        return $model;
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    public function isConfigured(): bool
    {
        return filled($this->access_key) && filled($this->secret_key) && filled($this->bucket) && filled($this->endpoint);
    }

    /**
     * @return array<string, mixed>
     */
    public function diskConfig(): array
    {
        return [
            'driver' => 's3',
            'key' => $this->access_key,
            'secret' => $this->secret_key,
            'region' => $this->region ?: 'us-east-1',
            'bucket' => $this->bucket,
            'endpoint' => $this->endpoint,
            'use_path_style_endpoint' => $this->use_path_style_endpoint,
            'url' => $this->publicUrlBase(),
            'throw' => true,
        ];
    }

    public function publicUrlBase(): ?string
    {
        if ($this->public_url) {
            return rtrim($this->public_url, '/');
        }

        if (! $this->endpoint || ! $this->bucket) {
            return null;
        }

        $endpoint = rtrim($this->endpoint, '/');

        // Path-style: https://endpoint/bucket — virtual-host style
        // (bucket como subdominio) no siempre funciona igual en cada
        // proveedor S3-compatible, path-style es lo más universal.
        return "{$endpoint}/{$this->bucket}";
    }
}
