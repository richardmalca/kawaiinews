<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsArticle;
use App\Support\PublicNewsCacheVersion;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    private const CACHE_TTL_MINUTES = 30;

    public function index(): Response
    {
        $xml = Cache::remember(
            'public-news:v'.PublicNewsCacheVersion::current().':sitemap-xml',
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            function () {
                $articles = NewsArticle::query()
                    ->where('status', 'published')
                    ->whereNotNull('published_at')
                    ->orderByDesc('published_at')
                    ->get(['slug', 'updated_at', 'published_at']);

                $categories = array_keys(config('news_sources_catalog', []));

                return view('sitemap.index', [
                    'articles' => $articles,
                    'categories' => $categories,
                ])->render();
            }
        );

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }
}
