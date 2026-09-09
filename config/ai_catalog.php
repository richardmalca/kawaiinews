<?php

return [
    'anthropic' => [
        'label' => 'Anthropic Claude',
        'models' => ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
    ],
    'openai' => [
        'label' => 'OpenAI',
        'models' => ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'o3'],
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
        'models' => [],
        'audio_model' => 'eleven_multilingual_v2',
    ],
];
