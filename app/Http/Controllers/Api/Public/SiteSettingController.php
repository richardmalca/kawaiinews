<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;

class SiteSettingController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $settings = SiteSetting::current();

        return response()->json([
            'name' => $settings->name,
            'seo_title' => $settings->seoTitle(),
            'description' => $settings->description,
            'logo_url' => $settings->logoUrl(),
            'favicon_url' => $settings->faviconUrl(),
            'favicon_192_url' => $settings->favicon192Url(),
            'favicon_512_url' => $settings->favicon512Url(),
            'apple_touch_icon_url' => $settings->appleTouchIconUrl(),
            'og_image_url' => $settings->ogImageUrl(),
            'theme_color' => $settings->theme_color,
            'keywords' => $settings->keywords,
            'twitter_handle' => $settings->twitter_handle,
            'search_box_enabled' => $settings->search_box_enabled,
            'social_links' => $settings->socialLinks(),
        ])->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    }
}
