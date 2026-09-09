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

        Auth::login($user, remember: true);

        return redirect()->intended($this->authRedirectService->redirectPathFor($user));
    }
}
