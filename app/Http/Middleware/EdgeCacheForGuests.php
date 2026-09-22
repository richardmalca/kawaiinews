<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Marca como cacheable en el borde de Cloudflare las respuestas de páginas
 * públicas de solo lectura, para visitantes anónimos. El resto del tiempo
 * cada visita recalcula todo el HTML en el servidor (SSR + Blade), lo que
 * mide ~1-2s por request — con esto, la inmensa mayoría de las visitas
 * (anónimas, que es casi todo el tráfico de un sitio de noticias) reciben
 * la página servida desde el borde de Cloudflare en vez de tocar el origen.
 *
 * Solo aplica a la carga inicial (sin header `X-Inertia`): las navegaciones
 * SPA dentro del sitio piden JSON con ese header y siguen yendo directo al
 * servidor, sin cachear — evita mezclar la variante HTML completa con la
 * variante JSON bajo la misma URL en la caché de Cloudflare.
 *
 * La purga puntual cuando cambia un artículo la hace CloudflareCacheService,
 * llamado desde NewsArticleService en los puntos donde se publica/edita.
 */
class EdgeCacheForGuests
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->isCacheable($request, $response)) {
            $response->headers->set(
                'Cache-Control',
                'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600'
            );

            // Cloudflare (y la mayoría de los CDN) no cachean una respuesta
            // cuyo Vary tenga algo más que Accept-Encoding — el framework
            // manda "Vary: X-Inertia" en toda respuesta Inertia, pero acá ya
            // no hace falta: la Cache Rule del lado de Cloudflare separa la
            // variante cacheable de la SPA por el propio request (matchea
            // "sin header X-Inertia"), así que el Vary queda redundante y
            // termina bloqueando el cacheo por completo.
            $response->headers->set('Vary', 'Accept-Encoding');
        }

        return $response;
    }

    private function isCacheable(Request $request, Response $response): bool
    {
        return $request->isMethod('GET')
            && $response->getStatusCode() === 200
            && ! $request->hasHeader('X-Inertia')
            && auth()->guest()
            && ! $request->session()->has('errors')
            && ! $request->session()->hasOldInput();
    }
}
