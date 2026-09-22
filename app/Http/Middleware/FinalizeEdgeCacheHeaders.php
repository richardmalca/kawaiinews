<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deja lista para el borde de Cloudflare la respuesta de una página que
 * EdgeCacheForGuests marcó como candidata, para un visitante anónimo:
 *
 * - Cache-Control cacheable (respetado por la Cache Rule del lado de
 *   Cloudflare).
 * - Vary reducido a solo Accept-Encoding — Cloudflare no cachea ninguna
 *   respuesta cuyo Vary tenga algo más (acá sobra "Vary: X-Inertia", que
 *   pone Inertia en toda respuesta; ya no hace falta porque la Cache Rule
 *   separa la variante cacheable por el propio request).
 * - Sin Set-Cookie — Cloudflare tampoco cachea una respuesta con cookie
 *   (con razón: la cachearía para todo el mundo). Un visitante anónimo
 *   mirando una página de solo lectura no depende de que ESTA respuesta
 *   puntual le renueve la sesión/CSRF.
 *
 * Tiene que ser middleware GLOBAL de verdad (registrado con
 * `$middleware->append()`, no dentro del grupo `web`) para garantizar que
 * corre después de StartSession/EncryptCookies al desenrollar la
 * respuesta — si fuera middleware de ruta o del grupo `web`, esos dos
 * vuelven a poner el Vary y la cookie de sesión después.
 */
class FinalizeEdgeCacheHeaders
{
    /**
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

            $response->headers->set('Vary', 'Accept-Encoding');

            foreach ($response->headers->getCookies() as $cookie) {
                $response->headers->removeCookie($cookie->getName(), $cookie->getPath(), $cookie->getDomain());
            }
        }

        return $response;
    }

    private function isCacheable(Request $request, Response $response): bool
    {
        return $request->attributes->get('edge_cacheable_route') === true
            && $request->isMethod('GET')
            && $response->getStatusCode() === 200
            && ! $request->hasHeader('X-Inertia')
            && auth()->guest()
            && ! $request->session()->has('errors')
            && ! $request->session()->hasOldInput();
    }
}
