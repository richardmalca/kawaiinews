<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsArticle;
use App\Support\PublicNewsCacheVersion;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class FeedController extends Controller
{
    private const MAX_ITEMS = 30;

    private const CACHE_TTL_MINUTES = 15;

    public function rss(): Response
    {
        $xml = Cache::remember(
            'public-news:v'.PublicNewsCacheVersion::current().':feed-rss',
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            function () {
                $articles = NewsArticle::query()
                    ->where('status', 'published')
                    ->whereNotNull('published_at')
                    ->orderByDesc('published_at')
                    ->take(self::MAX_ITEMS)
                    ->get();

                return view('feed.rss', ['articles' => $articles])->render();
            }
        );

        return response($xml, 200)->header('Content-Type', 'application/rss+xml; charset=UTF-8');
    }
}
