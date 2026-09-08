<?php

namespace App\Http\Responses;

use App\Services\AuthRedirectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    public function __construct(private readonly AuthRedirectService $authRedirectService) {}

    public function toResponse($request)
    {
        /** @var Request $request */
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        return redirect()->intended(
            $this->authRedirectService->redirectPathFor($request->user())
        );
    }
}
