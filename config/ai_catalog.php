<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Catálogo de proveedores de IA
    |--------------------------------------------------------------------------
    |
    | Lista de referencia de los proveedores que Prism soporta. `models` son
    | los modelos de texto más conocidos (el modelo por defecto se puede
    | escribir libremente en el formulario en cualquier momento). Todos los
    | proveedores de acá soportan texto; `image_model` y `audio_model` solo
    | están presentes en los que además soportan generar imágenes o audio
    | (texto-a-voz) — son la fuente de verdad que usa MediaLibraryService
    | para saber qué proveedor puede generar cada tipo de contenido.
    |
    */

    'anthropic' => [
        'label' => 'Anthropic Claude',
        'models' => ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
    ],
    'openai' => [
        'label' => 'OpenAI',
        'models' => ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'o3'],
        // `dall-e-3` ya no está disponible en cuentas/proyectos nuevos de
        // OpenAI (devuelve 400 "model does not exist"); `gpt-image-1` es su
        // reemplazo actual y es el que Prism sabe parsear (siempre devuelve
        // `b64_json`, nunca una URL).
        'image_model' => 'gpt-image-1',
        'audio_model' => 'gpt-4o-mini-tts',
    ],
    'gemini' => [
        'label' => 'Google Gemini',
        'models' => ['gemini-2.5-pro', 'gemini-2.5-flash'],
        'image_model' => 'imagen-4',
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
    'elevenlabs' => [
        'label' => 'ElevenLabs',
        // Solo hace texto-a-voz, no genera texto — sin modelos de texto en
        // el catálogo. `AiProviderService::catalog()` usa esto para no
        // ofrecerlo como opción de "Texto" en el selector de capacidades.
        'models' => [],
        'audio_model' => 'eleven_multilingual_v2',
    ],
];
