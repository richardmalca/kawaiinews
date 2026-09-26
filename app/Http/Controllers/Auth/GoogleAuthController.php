<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\AuthRedirectService;
use App\Services\Auth\GoogleAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly GoogleAuthService $googleAuthService,
        private readonly AuthRedirectService $authRedirectService,
    ) {}

    public function redirect(Request $request): RedirectResponse
    {
        $returnTo = $this->safeLocalUrl($request->query('return_to')) ?? $this->safeLocalUrl(url()->previous());

        if ($returnTo && ! str_contains($returnTo, '/auth/google') && ! str_contains($returnTo, '/login')) {
            session()->put('url.intended', $returnTo);
        }

        // El frontend Next.js (otro puerto/app, no puede compartir la sesión
        // web de Inertia) manda ?frontend=next al pedir el login. Lo
        // guardamos en sesión para que el callback, una vez vuelva de
        // Google, sepa que tiene que emitir un token de Sanctum y
        // redirigir de vuelta al Next en vez de loguear por sesión.
        if ($request->query('frontend') === 'next') {
            session()->put('auth.frontend', 'next');
            session()->put('auth.frontend_return_to', $returnTo ?? '/');
        }

        return Socialite::driver('google')->redirect();
    }

    private function safeLocalUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        if (! str_starts_with($url, '/') || str_starts_with($url, '//')) {
            return null;
        }

        return $url;
    }

    public function callback(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = $this->googleAuthService->findOrCreateUser($googleUser);

        // Ver el comentario en redirect(): si el login arrancó desde el
        // frontend Next.js, no hay sesión web que compartir entre los dos
        // puertos/apps — le mandamos un token de Sanctum de un solo uso
        // por la URL y que el propio Next.js lo guarde en su cookie
        // HttpOnly server-side (ver app/auth/callback/route.ts).
        if (session()->pull('auth.frontend') === 'next') {
            $token = $user->createToken('kawaiinews-next')->plainTextToken;
            $nextUrl = rtrim(config('services.kawaiinews_next.url'), '/');
            $returnTo = session()->pull('auth.frontend_return_to', '/');

            return redirect()->away(
                "{$nextUrl}/auth/callback?token=".urlencode($token).'&return_to='.urlencode($returnTo)
            );
        }

        Auth::login($user, remember: true);

        return redirect()->intended($this->authRedirectService->redirectPathFor($user));
    }
}
