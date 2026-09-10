<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @php
            $serverArticle = $page['props']['article']['data'] ?? $page['props']['article'] ?? null;
            $serverTitle = $serverArticle['title'] ?? config('app.name', 'KawaiiNews');
            $serverDescription = $serverArticle['excerpt'] ?? 'Tu portal definitivo de noticias de anime, manga, videojuegos y cultura otaku al instante.';
            $serverImage = $serverArticle['featured_image'] ?? asset('android-chrome-512x512.png');
            $serverUrl = $serverArticle['canonical_url'] ?? url()->current();
        @endphp

        <meta property="og:site_name" content="KawaiiNews">
        <meta property="og:type" content="{{ $serverArticle ? 'article' : 'website' }}">
        <meta property="og:title" content="{{ $serverTitle }}">
        <meta property="og:description" content="{{ $serverDescription }}">
        <meta property="og:url" content="{{ $serverUrl }}">
        <meta property="og:image" content="{{ $serverImage }}">
        <meta property="og:image:secure_url" content="{{ $serverImage }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@KawaiiNews">
        <meta name="twitter:title" content="{{ $serverTitle }}">
        <meta name="twitter:description" content="{{ $serverDescription }}">
        <meta name="twitter:image" content="{{ $serverImage }}">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
