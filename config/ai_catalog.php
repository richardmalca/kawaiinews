<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Catálogo de proveedores de IA
    |--------------------------------------------------------------------------
    |
    | Lista de referencia de los proveedores que Prism soporta y sus modelos
    | de texto más conocidos. Es solo informativa/orientativa para la UI de
    | administración: el modelo por defecto de cada proveedor se puede
    | escribir libremente en el formulario en cualquier momento.
    |
    */

    'anthropic' => [
        'label' => 'Anthropic Claude',
        'models' => ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
    ],
    'openai' => [
        'label' => 'OpenAI',
        'models' => ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'o3'],
    ],
    'gemini' => [
        'label' => 'Google Gemini',
        'models' => ['gemini-2.5-pro', 'gemini-2.5-flash'],
    ],
    'groq' => [
        'label' => 'Groq',
        'models' => ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    ],
    'mistral' => [
        'label' => 'Mistral',
        'models' => ['mistral-large-latest', 'mistral-small-latest'],
    ],
    'xai' => [
        'label' => 'xAI Grok',
        'models' => ['grok-4', 'grok-3'],
    ],
    'deepseek' => [
        'label' => 'DeepSeek',
        'models' => ['deepseek-chat', 'deepseek-reasoner'],
    ],
    'openrouter' => [
        'label' => 'OpenRouter',
        'models' => ['openrouter/auto'],
    ],
    'perplexity' => [
        'label' => 'Perplexity',
        'models' => ['sonar-pro', 'sonar'],
    ],
    'ollama' => [
        'label' => 'Ollama (local)',
        'models' => ['llama3.3', 'qwen2.5'],
    ],
    'z' => [
        'label' => 'Z.ai',
        'models' => ['glm-4.6'],
    ],
];
