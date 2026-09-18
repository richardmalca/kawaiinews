<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;

/**
 * El manifest.json vivía como archivo estático en public/, apuntando
 * siempre a los mismos PNG fijos (android-chrome-*.png) sin importar el
 * favicon que el admin suba desde Configuración del sitio — por eso el
 * ícono que Android usa para "agregar a pantalla de inicio" y el splash
 * screen quedaban desincronizados del favicon real. Ahora se genera acá
 * con los mismos assets que ya sirve SiteSetting.
 */
class ManifestController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $settings = SiteSetting::current();

        $icons = [
            [
                'src' => $settings->favicon192Url() ?? asset('android-chrome-192x192.png'),
                'sizes' => '192x192',
                'type' => 'image/png',
                'purpose' => 'any maskable',
            ],
            [
                'src' => $settings->favicon512Url() ?? asset('android-chrome-512x512.png'),
                'sizes' => '512x512',
                'type' => 'image/png',
                'purpose' => 'any maskable',
            ],
            [
                'src' => $settings->appleTouchIconUrl() ?? asset('apple-touch-icon.png'),
                'sizes' => '180x180',
                'type' => 'image/png',
            ],
        ];

        return response()->json([
            'name' => $settings->name,
            'short_name' => $settings->name,
            'description' => $settings->description ?? 'Tu portal definitivo de noticias de anime, manga, videojuegos y cultura otaku al instante.',
            'start_url' => '/',
            'scope' => '/',
            'display' => 'standalone',
            'orientation' => 'portrait-primary',
            'background_color' => '#09090b',
            'theme_color' => $settings->theme_color ?? '#e11d48',
            'icons' => $icons,
            'categories' => ['news', 'entertainment'],
        ])->header('Content-Type', 'application/manifest+json');
    }
}
