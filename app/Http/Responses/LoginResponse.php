<?php

namespace App\Http\Responses;

use App\Services\Auth\AuthRedirectService;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function __construct(private readonly AuthRedirectService $authRedirectService) {}

    public function toResponse($request)
    {
        /** @var Request $request */
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        return redirect()->intended(
            $this->authRedirectService->redirectPathFor($request->user())
        );
    }
}
