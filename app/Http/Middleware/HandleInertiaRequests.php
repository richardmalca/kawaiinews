<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use App\Support\SidebarAlerts;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $siteSettings = SiteSetting::current();

        return [
            ...parent::share($request),
            'name' => $siteSettings->name,
            'siteLogoUrl' => $siteSettings->logoUrl(),
            'siteSeoTitle' => $siteSettings->seoTitle(),
            'siteDescription' => $siteSettings->description,
            'siteOgImageUrl' => $siteSettings->ogImageUrl(),
            'searchBoxEnabled' => $siteSettings->search_box_enabled,
            // El sitio público ya no vive en este backend (era Inertia,
            // ahora es el Next.js en kawaiinews_next.url) — este backend
            // se está quedando solo como API + panel admin. "siteUrl" acá
            // apunta al sitio real que ve la gente, no a url('/') de este
            // dominio (que dejó de tener nada que mostrar en la raíz).
            'siteUrl' => rtrim(config('services.kawaiinews_next.url'), '/'),
            // Para armar <link rel="canonical"> y las URLs de OG/JSON-LD sin
            // depender de window.location: con SSR activo, el HTML que
            // ven Google y cualquier auditor externo se genera en el
            // servidor, donde `window` no existe — sin esto esas etiquetas
            // quedaban vacías en el HTML crudo aunque se vieran bien una
            // vez que el navegador hidrataba la página.
            'currentUrl' => $request->fullUrl(),
            'contactEmail' => $siteSettings->contactEmail(),
            'auth' => [
                'user' => $request->user() ? [
                    ...$request->user()->toArray(),
                    'active_avatar' => $request->user()->active_avatar_url,
                    'roles' => $request->user()->getRoleNames(),
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'moderationAlerts' => $this->moderationAlerts($request),
        ];
    }

    /**
     * Cuántos comentarios están bloqueados por la Capa 2 de IA ahora mismo,
     * para el badge de "Comentarios" en el sidebar — así el admin se entera
     * de que hay algo esperando revisión sin tener que entrar al panel.
     *
     * @return array{blocked_comments: int}|null
     */
    private function moderationAlerts(Request $request): ?array
    {
        if (! $request->user()?->hasRole('superadmin')) {
            return null;
        }

        return [
            'blocked_comments' => SidebarAlerts::blockedCommentsCount(),
            'high_credibility_rumors' => SidebarAlerts::highCredibilityRumorsCount(),
        ];
    }
}
