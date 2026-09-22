<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de ruta: solo marca qué requests son candidatos a quedar
 * cacheados en el borde de Cloudflare. No toca headers acá — ese trabajo
 * lo hace FinalizeEdgeCacheHeaders, que corre como middleware global de
 * verdad (fuera de toda la pila) para garantizar que sea lo último en
 * tocar la respuesta, después de StartSession/EncryptCookies.
 */
class EdgeCacheForGuests
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('edge_cacheable_route', true);

        return $next($request);
    }
}
