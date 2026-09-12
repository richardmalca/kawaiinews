<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">

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
            $serverTitle = isset($serverArticle['title'])
                ? $serverArticle['title'] . ' - KawaiiNews'
                : config('app.name', 'KawaiiNews');
            $serverDescription = $serverArticle['excerpt'] ?? 'Tu portal definitivo de noticias de anime, manga, videojuegos y cultura otaku al instante.';

            $rawImage = $serverArticle['featured_image'] ?? null;
            if ($rawImage) {
                if (str_contains($rawImage, '/storage/')) {
                    $path = parse_url($rawImage, PHP_URL_PATH);
                    $serverImage = url($path);
                } elseif (str_starts_with($rawImage, '/')) {
                    $serverImage = url($rawImage);
                } else {
                    $serverImage = $rawImage;
                }
            } else {
                $serverImage = asset('og-default.png');
            }

            if (request()->isSecure() && str_starts_with($serverImage, 'http://')) {
                $serverImage = 'https://' . substr($serverImage, 7);
            }

            $ext = strtolower(pathinfo(parse_url($serverImage, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            $serverImageType = match ($ext) {
                'png' => 'image/png',
                'webp' => 'image/webp',
                'jpg', 'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                default => 'image/png',
            };

            $serverUrl = $serverArticle['canonical_url'] ?? url()->current();
            if (request()->isSecure() && str_starts_with($serverUrl, 'http://')) {
                $serverUrl = 'https://' . substr($serverUrl, 7);
            }
        @endphp

        <meta property="og:site_name" content="KawaiiNews">
        <meta property="og:type" content="{{ $serverArticle ? 'article' : 'website' }}">
        <meta property="og:title" content="{{ $serverTitle }}">
        <meta property="og:description" content="{{ $serverDescription }}">
        <meta property="og:url" content="{{ $serverUrl }}">
        <meta property="og:image" content="{{ $serverImage }}">
        <meta property="og:image:secure_url" content="{{ $serverImage }}">
        <meta property="og:image:type" content="{{ $serverImageType }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="{{ $serverTitle }}">
        <meta property="og:locale" content="es_LA">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@KawaiiNews">
        <meta name="twitter:title" content="{{ $serverTitle }}">
        <meta name="twitter:description" content="{{ $serverDescription }}">
        <meta name="twitter:image" content="{{ $serverImage }}">
        <meta name="twitter:image:alt" content="{{ $serverTitle }}">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head>
            <title>{{ $serverTitle }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
