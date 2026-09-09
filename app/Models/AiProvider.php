<?php

namespace App\Models;

use Database\Factories\AiProviderFactory;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;

/**
 * @property int $id
 * @property string $provider
 * @property string $label
 * @property string $default_model
 * @property string|null $api_key
 * @property bool $is_active
 * @property bool $is_active_for_images
 * @property bool $is_active_for_audio
 * @property Carbon|null $last_verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['provider', 'label', 'default_model', 'api_key', 'is_active', 'is_active_for_images', 'is_active_for_audio', 'last_verified_at'])]
#[Hidden(['api_key'])]
class AiProvider extends Model
{
    /** @use HasFactory<AiProviderFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_active_for_images' => 'boolean',
            'is_active_for_audio' => 'boolean',
            'last_verified_at' => 'datetime',
        ];
    }

    /**
     * Igual que el cast `encrypted` de Eloquent, salvo que un valor que no
     * se puede desencriptar (ej. una fila que llegó de otro entorno con
     * distinta APP_KEY) se trata como "sin key" en vez de tirar
     * DecryptException y romper toda la página.
     */
    protected function apiKey(): Attribute
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

    public function hasApiKey(): bool
    {
        return filled($this->api_key);
    }

    public function supportsText(): bool
    {
        return filled(config("ai_catalog.{$this->provider}.models"));
    }

    public function supportsImages(): bool
    {
        return filled(config("ai_catalog.{$this->provider}.image_model"));
    }

    public function supportsAudio(): bool
    {
        return filled(config("ai_catalog.{$this->provider}.audio_model"));
    }
}
