<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsArticle;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $articles = NewsArticle::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->get(['slug', 'updated_at', 'published_at']);

        $categories = array_keys(config('news_sources_catalog', []));

        $xml = view('sitemap.index', [
            'articles' => $articles,
            'categories' => $categories,
        ])->render();

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }
}
