<?php

namespace App\Models;

use Database\Factories\AiUsageLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property string $kind
 * @property string $provider
 * @property string $model
 * @property int $prompt_tokens
 * @property int $completion_tokens
 */
#[Fillable(['kind', 'provider', 'model', 'prompt_tokens', 'completion_tokens', 'subject_type', 'subject_id'])]
class AiUsageLog extends Model
{
    /** @use HasFactory<AiUsageLogFactory> */
    use HasFactory;

    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'prompt_tokens' => 'integer',
            'completion_tokens' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Costo estimado de esta fila en dólares, según config/ai_pricing.php.
     * Es una aproximación con tarifas públicas, no factura real del
     * proveedor — por eso null cuando no tenemos precio cargado para el
     * modelo, en vez de inventar un número.
     */
    public function estimatedCostUsd(): ?float
    {
        $pricing = config("ai_pricing.{$this->provider}.{$this->model}");

        if (! $pricing) {
            return null;
        }

        return ($this->prompt_tokens / 1_000_000 * $pricing['input'])
            + ($this->completion_tokens / 1_000_000 * $pricing['output']);
    }
}
