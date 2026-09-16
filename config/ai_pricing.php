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
    // Google Cloud Text-to-Speech no cobra por token sino por carácter —
    // se reutiliza el mismo cálculo "input" guardando los caracteres
    // narrados como prompt_tokens (ver MediaLibraryService::generateNarration),
    // así el estimado sale bien sin armar una fórmula aparte para uno
    // solo. Los primeros 1.000.000 de caracteres por mes con esta voz
    // (WaveNet) son gratis, así que el estimado acá es un techo, no lo
    // que realmente se termina pagando la mayoría de los meses.
    'google-tts' => [
        'es-US-Wavenet-B' => ['input' => 4.0, 'output' => 0.0],
    ],
];
