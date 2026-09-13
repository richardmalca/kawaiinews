<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteSettingRequest;
use App\Models\SiteSetting;
use App\Services\Admin\SeoAuditService;
use App\Services\Admin\SiteSettingService;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingController extends Controller
{
    public function __construct(
        private readonly SiteSettingService $siteSettingService,
        private readonly SeoAuditService $seoAuditService,
    ) {}

    public function edit(): Response
    {
        $settings = SiteSetting::current();

        return Inertia::render('admin/site-settings/index', [
            'settings' => $this->present($settings),
        ]);
    }

    public function update(UpdateSiteSettingRequest $request): RedirectResponse
    {
        $settings = $this->siteSettingService->update(SiteSetting::current(), $request->validated());

        ActivityLogger::log('site_settings.updated', $settings, 'Actualizó la configuración del sitio');

        return back();
    }

    public function updateLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'image', Rule::dimensions()->maxWidth(4000)->maxHeight(4000), 'max:4096'],
        ]);

        $this->siteSettingService->updateLogo(SiteSetting::current(), $request->file('logo'));

        ActivityLogger::log('site_settings.logo_updated', description: 'Cambió el logo del sitio');

        return back();
    }

    public function destroyLogo(): RedirectResponse
    {
        $this->siteSettingService->removeLogo(SiteSetting::current());

        ActivityLogger::log('site_settings.logo_removed', description: 'Quitó el logo del sitio');

        return back();
    }

    public function updateFavicon(Request $request): RedirectResponse
    {
        $request->validate([
            'favicon' => ['required', 'image', Rule::dimensions()->minWidth(64)->minHeight(64), 'max:4096'],
        ]);

        $this->siteSettingService->updateFavicon(SiteSetting::current(), $request->file('favicon'));

        ActivityLogger::log('site_settings.favicon_updated', description: 'Cambió el favicon del sitio');

        return back();
    }

    public function updateSearchBox(Request $request): RedirectResponse
    {
        $request->validate(['enabled' => ['required', 'boolean']]);

        SiteSetting::current()->update(['search_box_enabled' => $request->boolean('enabled')]);

        ActivityLogger::log(
            'site_settings.search_box_toggled',
            description: $request->boolean('enabled') ? 'Activó el buscador de Google (sitelinks)' : 'Desactivó el buscador de Google (sitelinks)',
        );

        return back();
    }

    public function seoAudit(): JsonResponse
    {
        return response()->json($this->seoAuditService->audit(SiteSetting::current()));
    }

    public function updateOgImage(Request $request): RedirectResponse
    {
        $request->validate([
            'og_image' => ['required', 'image', 'max:8192'],
        ]);

        $this->siteSettingService->updateOgImage(SiteSetting::current(), $request->file('og_image'));

        ActivityLogger::log('site_settings.og_image_updated', description: 'Cambió la imagen de OpenGraph por defecto');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function present(SiteSetting $settings): array
    {
        return [
            'name' => $settings->name,
            'seo_title' => $settings->seo_title,
            'description' => $settings->description,
            'keywords' => $settings->keywords ?? [],
            'theme_color' => $settings->theme_color,
            'twitter_handle' => $settings->twitter_handle,
            'facebook_url' => $settings->facebook_url,
            'instagram_url' => $settings->instagram_url,
            'tiktok_url' => $settings->tiktok_url,
            'search_box_enabled' => $settings->search_box_enabled,
            'logo_url' => $settings->logoUrl(),
            'favicon_url' => $settings->faviconUrl(),
            'favicon_192_url' => $settings->favicon192Url(),
            'apple_touch_icon_url' => $settings->appleTouchIconUrl(),
            'og_image_url' => $settings->ogImageUrl(),
            'canonical_url' => url('/'),
        ];
    }
}
