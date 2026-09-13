<?php

/**
 * Precios públicos aproximados en USD por 1M de tokens (input/output), solo
 * para estimar el gasto en el panel — no reemplazan la factura real del
 * proveedor. Un modelo que no está acá simplemente no suma al estimado (en
 * vez de mostrar un número inventado). Actualizar a mano si cambian.
 */
return [
    'anthropic' => [
        'claude-opus-5' => ['input' => 15.0, 'output' => 75.0],
        'claude-sonnet-5' => ['input' => 3.0, 'output' => 15.0],
        'claude-haiku-4-5' => ['input' => 1.0, 'output' => 5.0],
    ],
    'openai' => [
        'gpt-5' => ['input' => 5.0, 'output' => 15.0],
        'gpt-5-mini' => ['input' => 0.25, 'output' => 2.0],
        'gpt-4.1' => ['input' => 2.0, 'output' => 8.0],
        'o3' => ['input' => 2.0, 'output' => 8.0],
    ],
    'gemini' => [
        'gemini-2.5-pro' => ['input' => 1.25, 'output' => 10.0],
        'gemini-2.5-flash' => ['input' => 0.3, 'output' => 2.5],
    ],
];
