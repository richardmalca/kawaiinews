<?php

use App\Http\Middleware\EdgeCacheForGuests;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Middleware\RoleMiddleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Forge (nginx local) + Cloudflare: toda la cadena hasta la app es de confianza.
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'edge-cache' => EdgeCacheForGuests::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // EdgeCacheForGuests es middleware de ruta (solo aplica a un grupo
        // puntual de rutas), pero por default Laravel siempre ejecuta el
        // middleware de ruta más "adentro" que el del grupo `web` global —
        // así que al desenrollar la respuesta, HandleInertiaRequests (que
        // pone `Vary: X-Inertia` en toda respuesta Inertia) corre DESPUÉS y
        // pisa el `Vary: Accept-Encoding` que EdgeCacheForGuests necesita
        // dejar puesto para que Cloudflare pueda cachear. En priority(), el
        // que aparece primero es el más "afuera" (su lógica de salida
        // corre última) — por eso EdgeCacheForGuests va antes que
        // HandleInertiaRequests acá, así su Vary gana al final.
        $middleware->priority([
            EdgeCacheForGuests::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // 404/403/500/503 se renderizan como una página de Inertia
        // (resources/js/pages/error.tsx, con `status` como prop) en vez
        // de la vista de error en blanco de Laravel — así se ve con el
        // diseño del sitio, incluso durante una navegación SPA. Esa
        // página todavía no existe (le toca al frontend público
        // crearla); hasta entonces esto va a fallar con el error de
        // "componente no encontrado" de Inertia en vez de la pantalla en
        // blanco de Laravel, así que hay que coordinarlo con esa página
        // antes de considerar esto terminado. Patrón estándar de la
        // documentación de Inertia + Laravel.
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if (! app()->environment(['local', 'testing'])
                && in_array($response->getStatusCode(), [404, 403, 500, 503], true)
            ) {
                return Inertia::render('error', ['status' => $response->getStatusCode()])
                    ->toResponse($request)
                    ->setStatusCode($response->getStatusCode());
            }

            if ($response->getStatusCode() === 419) {
                return back()->with([
                    'message' => 'La página expiró, probá de nuevo.',
                ]);
            }

            return $response;
        });
    })->create();
