<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsArticle;
use Illuminate\Http\Response;

class FeedController extends Controller
{
    private const MAX_ITEMS = 30;

    public function rss(): Response
    {
        $articles = NewsArticle::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->take(self::MAX_ITEMS)
            ->get();

        $xml = view('feed.rss', ['articles' => $articles])->render();

        return response($xml, 200)->header('Content-Type', 'application/rss+xml; charset=UTF-8');
    }
}
