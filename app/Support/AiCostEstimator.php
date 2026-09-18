<?php

namespace App\Support;

use Illuminate\Support\Collection;

/**
 * Calcula el gasto estimado en USD a partir de filas agrupadas de
 * ai_usage_logs (kind, provider, model, calls, prompt_tokens,
 * completion_tokens) usando la tabla de precios de config/ai_pricing.php
 * — compartido entre el panel de costo de IA general (AiUsageController) y
 * el de costo de IA por autor (AuthorStatsController), para no calcular la
 * misma fórmula en dos lugares distintos.
 */
class AiCostEstimator
{
    /**
     * @param  Collection<int, object{kind: string, provider: string, model: string, calls: int, prompt_tokens: int, completion_tokens: int}>  $rows
     * @return array{by_kind: array<string, array{calls: int, prompt_tokens: int, completion_tokens: int, estimated_cost_usd: float}>, total_cost_usd: float, has_unknown_pricing: bool}
     */
    public static function estimate(Collection $rows): array
    {
        $byKind = [];
        $totalCost = 0.0;
        $hasUnknownPricing = false;

        foreach ($rows as $row) {
            $cost = $row->kind === 'image'
                ? self::imageCost($row)
                : self::tokenCost($row);

            if ($cost === null) {
                $hasUnknownPricing = true;
            } else {
                $totalCost += $cost;
            }

            $byKind[$row->kind] ??= ['calls' => 0, 'prompt_tokens' => 0, 'completion_tokens' => 0, 'estimated_cost_usd' => 0.0];
            $byKind[$row->kind]['calls'] += (int) $row->calls;
            $byKind[$row->kind]['prompt_tokens'] += (int) $row->prompt_tokens;
            $byKind[$row->kind]['completion_tokens'] += (int) $row->completion_tokens;
            $byKind[$row->kind]['estimated_cost_usd'] += $cost ?? 0.0;
        }

        return [
            'by_kind' => $byKind,
            'total_cost_usd' => round($totalCost, 2),
            'has_unknown_pricing' => $hasUnknownPricing,
        ];
    }

    /**
     * @param  object{provider: string, model: string, prompt_tokens: int, completion_tokens: int}  $row
     */
    private static function tokenCost(object $row): ?float
    {
        $pricing = self::modelPricing($row->provider, $row->model);

        if (! $pricing) {
            return null;
        }

        return ($row->prompt_tokens / 1_000_000 * $pricing['input']) + ($row->completion_tokens / 1_000_000 * $pricing['output']);
    }

    /**
     * La generación de imagen se cobra por imagen, no por token de texto —
     * ver el comentario de "image_per_call" en config/ai_pricing.php.
     *
     * @param  object{provider: string, model: string, calls: int}  $row
     */
    private static function imageCost(object $row): ?float
    {
        $pricePerImage = self::modelPricing($row->provider, $row->model, 'image_per_call');

        return $pricePerImage ? $row->calls * $pricePerImage : null;
    }

    /**
     * Busca el precio de un modelo dentro de config/ai_pricing.php sin
     * armar la ruta como un string con puntos (config("ai_pricing.{$provider}.{$model}")):
     * varios nombres de modelo tienen un punto (gpt-4.1,
     * gemini-3.1-flash-image-preview), y Laravel interpreta cada punto de
     * un string de config como un nivel anidado más — así que ese modelo
     * nunca se encontraba, aunque estuviera cargado en la tabla. Acá se
     * trae el array del proveedor entero y se indexa el modelo como clave
     * literal, no como parte de una ruta.
     */
    private static function modelPricing(string $provider, string $model, string $table = ''): mixed
    {
        $key = $table !== '' ? "ai_pricing.{$table}.{$provider}" : "ai_pricing.{$provider}";

        return (config($key) ?? [])[$model] ?? null;
    }
}
