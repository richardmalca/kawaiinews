<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\ProfileSettingsDeleteRequest;
use App\Http\Requests\Public\ProfileSettingsUpdateRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Configuración de la propia cuenta pública, en /perfil/{username}/ajustes
 * (layout público, sin el sidebar del panel admin, y URL en español como el
 * resto del sitio público). Separado a propósito de Settings\ProfileController,
 * que vive en /settings y usa el layout del panel admin (solo pensado para
 * superadmin/admin/editor).
 */
class ProfileSettingsController extends Controller
{
    /**
     * Alias estable (`perfil/mi-cuenta/ajustes`) para quien todavía no
     * eligió su @usuario: no hay segmento de URL "propio" al que mandarlo
     * todavía, así que lo llevamos a elegirlo antes de poder ver su
     * configuración por la URL bonita `/perfil/{username}/ajustes`.
     */
    public function redirectToSelf(Request $request): RedirectResponse|Response
    {
        $user = $request->user();

        if ($user->username) {
            return to_route('public.profile.settings.edit', $user->username);
        }

        return Inertia::render('public/profile/settings/choose-username');
    }

    public function edit(Request $request, string $username): Response
    {
        $this->authorizeOwner($request, $username);

        return Inertia::render('public/profile/settings/edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileSettingsUpdateRequest $request, string $username): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('public.profile.settings.edit', $request->user()->username);
    }

    public function destroy(ProfileSettingsDeleteRequest $request, string $username): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function authorizeOwner(Request $request, string $username): void
    {
        if ($request->user()?->username !== $username) {
            throw new AuthorizationException('No podés ver la configuración de otro perfil.');
        }
    }
}
