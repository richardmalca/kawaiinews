<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $provider
 * @property string $label
 * @property string $default_model
 * @property string|null $api_key
 * @property bool $is_active
 * @property Carbon|null $last_verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['provider', 'label', 'default_model', 'api_key', 'is_active', 'last_verified_at'])]
#[Hidden(['api_key'])]
class AiProvider extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'api_key' => 'encrypted',
            'is_active' => 'boolean',
            'last_verified_at' => 'datetime',
        ];
    }

    public function hasApiKey(): bool
    {
        return filled($this->api_key);
    }
}
