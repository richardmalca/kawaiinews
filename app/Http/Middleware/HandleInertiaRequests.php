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
            // Dominio real de la app (nunca un string hardcodeado): así
            // cualquier página, pública o admin, arma links/emails/textos
            // sin tipear el dominio a mano y sin desincronizarse si cambia.
            'siteUrl' => rtrim(url('/'), '/'),
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
