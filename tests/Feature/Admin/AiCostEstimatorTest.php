<?php

use App\Support\AiCostEstimator;
use Illuminate\Support\Collection;

function usageRow(array $overrides = []): object
{
    return (object) array_merge([
        'kind' => 'draft',
        'provider' => 'openai',
        'model' => 'gpt-5',
        'calls' => 1,
        'prompt_tokens' => 0,
        'completion_tokens' => 0,
    ], $overrides);
}

test('token based kinds are priced per million tokens', function () {
    $rows = new Collection([
        usageRow(['kind' => 'draft', 'provider' => 'openai', 'model' => 'gpt-5', 'prompt_tokens' => 1_000_000, 'completion_tokens' => 1_000_000]),
    ]);

    $result = AiCostEstimator::estimate($rows);

    // gpt-5: $5 input + $15 output por millón de tokens.
    expect($result['by_kind']['draft']['estimated_cost_usd'])->toBe(20.0)
        ->and($result['total_cost_usd'])->toBe(20.0)
        ->and($result['has_unknown_pricing'])->toBeFalse();
});

test('image generation is priced per call, not per token', function () {
    $rows = new Collection([
        usageRow(['kind' => 'image', 'provider' => 'openai', 'model' => 'gpt-image-1', 'calls' => 3, 'prompt_tokens' => 999_999, 'completion_tokens' => 999_999]),
    ]);

    $result = AiCostEstimator::estimate($rows);

    // 3 llamadas * $0.04/imagen, sin importar los tokens que traiga la fila.
    expect($result['by_kind']['image']['estimated_cost_usd'])->toBe(0.12)
        ->and($result['total_cost_usd'])->toBe(0.12);
});

test('a model name containing a dot is priced correctly (regression: config() treats dots as nested keys)', function () {
    $rows = new Collection([
        usageRow(['kind' => 'draft', 'provider' => 'openai', 'model' => 'gpt-4.1', 'prompt_tokens' => 1_000_000, 'completion_tokens' => 1_000_000]),
        usageRow(['kind' => 'image', 'provider' => 'gemini', 'model' => 'gemini-3.1-flash-image-preview', 'calls' => 2]),
    ]);

    $result = AiCostEstimator::estimate($rows);

    // gpt-4.1: $2 input + $8 output por millón de tokens.
    expect($result['by_kind']['draft']['estimated_cost_usd'])->toBe(10.0)
        ->and($result['by_kind']['image']['estimated_cost_usd'])->toBe(0.08)
        ->and($result['has_unknown_pricing'])->toBeFalse();
});

test('a model missing from the pricing table does not add to the total, and flags has_unknown_pricing', function () {
    $rows = new Collection([
        usageRow(['kind' => 'image', 'provider' => 'openai', 'model' => 'some-future-model', 'calls' => 5]),
    ]);

    $result = AiCostEstimator::estimate($rows);

    expect($result['by_kind']['image']['estimated_cost_usd'])->toBe(0.0)
        ->and($result['total_cost_usd'])->toBe(0.0)
        ->and($result['has_unknown_pricing'])->toBeTrue();
});
