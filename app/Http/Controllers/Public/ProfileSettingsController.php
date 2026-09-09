<?php

namespace App\Http\Controllers\Public;

use App\Concerns\ProfileValidationRules;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\ProfileSettingsDeleteRequest;
use App\Http\Requests\Public\ProfileSettingsUpdateRequest;
use App\Services\Public\NewsService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileSettingsController extends Controller
{
    use ProfileValidationRules;

    public function __construct(
        private readonly NewsService $newsService,
    ) {}

    public function redirectToSelf(Request $request): RedirectResponse|Response
    {
        $user = $request->user();

        if ($user->username) {
            return to_route('public.profile.settings.edit', $user->username);
        }

        return Inertia::render('public/profile/settings/choose-username', [
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }

    public function updateSelf(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => $this->usernameRules($request->user()->id, required: true),
        ]);

        $request->user()->update([
            'username' => $validated['username'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nombre de usuario asignado correctamente.']);

        return to_route('public.profile.settings.edit', $request->user()->username);
    }

    public function edit(Request $request, string $username): Response
    {
        $this->authorizeOwner($request, $username);

        return Inertia::render('public/profile/settings/edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }

    public function update(ProfileSettingsUpdateRequest $request, string $username): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($request->hasFile('custom_avatar')) {
            if ($user->custom_avatar && Storage::disk('public')->exists(str_replace('/storage/', '', $user->custom_avatar))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $user->custom_avatar));
            }

            $path = $request->file('custom_avatar')->store('avatars', 'public');
            $validated['custom_avatar'] = '/storage/'.$path;
            $validated['avatar_source'] = 'custom';
        }

        if ($request->hasFile('banner')) {
            if ($user->banner && str_starts_with($user->banner, '/storage/') && Storage::disk('public')->exists(str_replace('/storage/', '', $user->banner))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $user->banner));
            }

            $path = $request->file('banner')->store('banners', 'public');
            $validated['banner'] = '/storage/'.$path;
        } elseif ($request->filled('banner') && is_string($request->input('banner'))) {
            $validated['banner'] = $request->input('banner');
        }

        if ($request->filled('avatar_source')) {
            $validated['avatar_source'] = $request->input('avatar_source');
        }

        $user->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perfil actualizado con éxito.']);

        return to_route('public.profile.settings.edit', $user->fresh()->username);
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
