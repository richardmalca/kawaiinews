<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

        <meta name="theme-color" content="#ffffff">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const stored = localStorage.getItem('appearance');
                const appearance = stored || '{{ $appearance ?? "system" }}';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark);

                if (isDark) {
                    document.documentElement.classList.add('dark');
                    const meta = document.querySelector('meta[name="theme-color"]');
                    if (meta) meta.setAttribute('content', '#0a0a0a');
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

        @php
            $siteSettings = \App\Models\SiteSetting::current();
            $storageSettings = \App\Models\StorageSetting::current();
        @endphp

        {{-- Si las imágenes de artículos viven en un dominio aparte (R2/S3),
        arrancamos la conexión (DNS + TLS) apenas se parsea el <head>, en vez
        de esperar a que el navegador descubra el primer <img> — eso corta
        tiempo real de la carga de la imagen del LCP (hero de la home,
        portada del artículo), que es justo la más lenta cuando el dominio
        es nuevo para el navegador. --}}
        @if ($storageSettings->active_for_media && $storageSettings->public_url)
            <link rel="preconnect" href="{{ $storageSettings->public_url }}" crossorigin>
            <link rel="dns-prefetch" href="{{ $storageSettings->public_url }}">
        @endif

        @if ($siteSettings->faviconUrl())
            <link rel="icon" href="{{ $siteSettings->faviconUrl() }}" sizes="32x32" type="image/png">
        @else
            <link rel="icon" href="/favicon.ico" sizes="any">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        @endif
        @if ($siteSettings->favicon192Url())
            <link rel="icon" href="{{ $siteSettings->favicon192Url() }}" sizes="192x192" type="image/png">
        @endif
        <link rel="apple-touch-icon" href="{{ $siteSettings->appleTouchIconUrl() ?? '/apple-touch-icon.png' }}">
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a">

        {{-- PWA Manifest & Mobile Capability --}}
        <link rel="manifest" href="{{ route('manifest') }}">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ $siteSettings->name ?? 'KawaiiNews' }}">

        {{-- iOS Dynamic Splash Screens (Light & Dark) --}}
        @php
            $iosDevices = [
                ['w' => 440, 'h' => 956, 'r' => 3, 'pw' => 1320, 'ph' => 2868], // iPhone 16 Pro Max
                ['w' => 402, 'h' => 874, 'r' => 3, 'pw' => 1206, 'ph' => 2622], // iPhone 16 Pro
                ['w' => 430, 'h' => 932, 'r' => 3, 'pw' => 1290, 'ph' => 2796], // iPhone 15/16 Plus, 15/16 Pro Max
                ['w' => 393, 'h' => 852, 'r' => 3, 'pw' => 1179, 'ph' => 2556], // iPhone 15/16, 15 Pro, 14 Pro
                ['w' => 428, 'h' => 926, 'r' => 3, 'pw' => 1284, 'ph' => 2778], // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
                ['w' => 390, 'h' => 844, 'r' => 3, 'pw' => 1170, 'ph' => 2532], // iPhone 14, 13, 13 Pro, 12, 12 Pro
                ['w' => 375, 'h' => 812, 'r' => 3, 'pw' => 1125, 'ph' => 2436], // iPhone 13 mini, 12 mini, 11 Pro, XS, X
                ['w' => 414, 'h' => 896, 'r' => 3, 'pw' => 1242, 'ph' => 2688], // iPhone 11 Pro Max, XS Max
                ['w' => 414, 'h' => 896, 'r' => 2, 'pw' => 828, 'ph' => 1792],  // iPhone 11, XR
                ['w' => 375, 'h' => 667, 'r' => 2, 'pw' => 750, 'ph' => 1334],  // iPhone SE (2nd/3rd gen), 8, 7, 6s
                ['w' => 1024, 'h' => 1366, 'r' => 2, 'pw' => 2048, 'ph' => 2732], // iPad Pro 12.9"
                ['w' => 834, 'h' => 1194, 'r' => 2, 'pw' => 1668, 'ph' => 2388],  // iPad Pro 11"
                ['w' => 820, 'h' => 1180, 'r' => 2, 'pw' => 1640, 'ph' => 2360],  // iPad Air 10.9"
                ['w' => 810, 'h' => 1080, 'r' => 2, 'pw' => 1620, 'ph' => 2160],  // iPad 10.2"
                ['w' => 744, 'h' => 1133, 'r' => 2, 'pw' => 1488, 'ph' => 2266],  // iPad mini 8.3"
            ];
        @endphp
        @foreach ($iosDevices as $device)
            <link rel="apple-touch-startup-image"
                  media="(device-width: {{ $device['w'] }}px) and (device-height: {{ $device['h'] }}px) and (-webkit-device-pixel-ratio: {{ $device['r'] }}) and (prefers-color-scheme: light)"
                  href="{{ route('apple.splash', ['width' => $device['pw'], 'height' => $device['ph'], 'theme' => 'light']) }}">
            <link rel="apple-touch-startup-image"
                  media="(device-width: {{ $device['w'] }}px) and (device-height: {{ $device['h'] }}px) and (-webkit-device-pixel-ratio: {{ $device['r'] }}) and (prefers-color-scheme: dark)"
                  href="{{ route('apple.splash', ['width' => $device['pw'], 'height' => $device['ph'], 'theme' => 'dark']) }}">
        @endforeach

        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                        console.warn('Service Worker registration failed:', err);
                    });
                });
            }
        </script>

        @fonts

        @php
            $serverArticle = $page['props']['article']['data'] ?? $page['props']['article'] ?? null;
            $serverTitle = isset($serverArticle['title'])
                ? $serverArticle['title'] . ' - ' . $siteSettings->name
                : $siteSettings->seoTitle();
            $serverDescription = $serverArticle['excerpt'] ?? $siteSettings->description ?? 'Tu portal definitivo de noticias de anime, manga, videojuegos y cultura otaku al instante.';

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
                $serverImage = $siteSettings->ogImageUrl() ?? asset('og-default.png');
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

        <meta property="og:site_name" content="{{ $siteSettings->name }}">
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
        @if ($siteSettings->twitter_handle)
            <meta name="twitter:site" content="{{ '@' . ltrim($siteSettings->twitter_handle, '@') }}">
        @endif
        @if ($siteSettings->keywords)
            <meta name="keywords" content="{{ implode(', ', $siteSettings->keywords) }}">
        @endif
        <meta name="twitter:title" content="{{ $serverTitle }}">
        <meta name="twitter:description" content="{{ $serverDescription }}">
        <meta name="twitter:image" content="{{ $serverImage }}">
        <meta name="twitter:image:alt" content="{{ $serverTitle }}">

        @php
            $organizationSchema = [
                '@context' => 'https://schema.org',
                '@type' => 'Organization',
                'name' => $siteSettings->name,
                'url' => url('/'),
            ];
            if ($siteSettings->logoUrl()) {
                $organizationSchema['logo'] = $siteSettings->logoUrl();
            }
            if ($siteSettings->socialLinks()) {
                $organizationSchema['sameAs'] = $siteSettings->socialLinks();
            }
            $websiteSchema = null;
            if ($siteSettings->search_box_enabled) {
                $websiteSchema = [
                    '@context' => 'https://schema.org',
                    '@type' => 'WebSite',
                    'name' => $siteSettings->name,
                    'url' => url('/'),
                    'potentialAction' => [
                        '@type' => 'SearchAction',
                        // El home ya soporta ?q= para filtrar artículos, así
                        // que la "sitelinks search box" de Google apunta ahí
                        // directamente, sin depender de una página nueva.
                        'target' => [
                            '@type' => 'EntryPoint',
                            'urlTemplate' => url('/').'?q={search_term_string}',
                        ],
                        'query-input' => 'required name=search_term_string',
                    ],
                ];
            }
        @endphp
        <script type="application/ld+json">{!! json_encode($organizationSchema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
        @if ($websiteSchema)
            <script type="application/ld+json">{!! json_encode($websiteSchema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
        @endif

        {{-- Google Analytics (gtag.js) --}}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GNT069MNL0"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GNT069MNL0');
        </script>

        {{-- Google AdSense --}}
        <meta name="google-adsense-account" content="ca-pub-2454606039462818">
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2454606039462818" crossorigin="anonymous"></script>

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
