<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
use App\Models\NewsArticle;
use App\Support\AiCostEstimator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Mis noticias": el panel de KPIs propio de cada redactor (vistas, me
 * gusta, comentarios de lo que escribió, y lo que gastó en IA generando
 * ese contenido) — a diferencia del Panel general, que es todo el sitio y
 * queda reservado a superadmin.
 */
class AuthorStatsController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $articles = NewsArticle::where('author_id', $userId)
            ->withCount(['likers', 'favoriters', 'comments'])
            ->orderByDesc('views_count')
            ->get(['id', 'title', 'slug', 'category', 'status', 'views_count', 'published_at']);

        $totals = [
            'articles' => $articles->count(),
            'published' => $articles->where('status', 'published')->count(),
            'views' => (int) $articles->sum('views_count'),
            'likes' => (int) $articles->sum('likers_count'),
            'favorites' => (int) $articles->sum('favoriters_count'),
            'comments' => (int) $articles->sum('comments_count'),
        ];

        $usageRows = AiUsageLog::where('subject_type', NewsArticle::class)
            ->whereIn('subject_id', $articles->pluck('id'))
            ->select('kind', 'provider', 'model')
            ->selectRaw('count(*) as calls, sum(prompt_tokens) as prompt_tokens, sum(completion_tokens) as completion_tokens')
            ->groupBy('kind', 'provider', 'model')
            ->get();

        $aiCost = AiCostEstimator::estimate($usageRows);

        return Inertia::render('admin/author-stats/index', [
            'articles' => $articles->map(fn (NewsArticle $article) => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'category' => $article->category,
                'status' => $article->status,
                'views' => $article->views_count,
                'likes' => $article->likers_count,
                'favorites' => $article->favoriters_count,
                'comments' => $article->comments_count,
                'published_at' => $article->published_at?->diffForHumans(),
            ])->values(),
            'totals' => $totals,
            'aiCost' => [
                'by_kind' => $aiCost['by_kind'],
                'total_usd' => $aiCost['total_cost_usd'],
                'has_unknown_pricing' => $aiCost['has_unknown_pricing'],
            ],
        ]);
    }
}
