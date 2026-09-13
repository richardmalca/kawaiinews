<?php

namespace App\Support;

use App\Models\AiUsageLog;
use Illuminate\Database\Eloquent\Model;
use Prism\Prism\ValueObjects\Usage;

/**
 * Persiste cada llamada a un modelo de IA (redacción, imagen, análisis en
 * lote, moderación) para poder ver el gasto acumulado en el panel — antes
 * esto solo quedaba en storage/logs/laravel.log, ilegible a mediano plazo.
 */
class AiUsageLogger
{
    public static function record(
        string $kind,
        string $provider,
        string $model,
        Usage $usage,
        ?Model $subject = null,
    ): void {
        AiUsageLog::create([
            'kind' => $kind,
            'provider' => $provider,
            'model' => $model,
            'prompt_tokens' => $usage->promptTokens,
            'completion_tokens' => $usage->completionTokens,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'created_at' => now(),
        ]);
    }
}
