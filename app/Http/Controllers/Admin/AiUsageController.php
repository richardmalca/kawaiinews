<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
use App\Support\AiCostEstimator;
use Inertia\Inertia;
use Inertia\Response;

class AiUsageController extends Controller
{
    public function index(): Response
    {
        $startOfMonth = now()->startOfMonth();

        $rows = AiUsageLog::where('created_at', '>=', $startOfMonth)
            ->select('kind', 'provider', 'model')
            ->selectRaw('count(*) as calls, sum(prompt_tokens) as prompt_tokens, sum(completion_tokens) as completion_tokens')
            ->groupBy('kind', 'provider', 'model')
            ->get();

        $estimate = AiCostEstimator::estimate($rows);

        return Inertia::render('admin/ai-usage/index', [
            'month' => $startOfMonth->translatedFormat('F Y'),
            'byKind' => $estimate['by_kind'],
            'totalCallsThisMonth' => (int) $rows->sum('calls'),
            'estimatedCostUsd' => $estimate['total_cost_usd'],
            'hasUnknownPricing' => $estimate['has_unknown_pricing'],
            'byModel' => $rows->map(fn ($row) => [
                'kind' => $row->kind,
                'provider' => $row->provider,
                'model' => $row->model,
                'calls' => (int) $row->calls,
                'prompt_tokens' => (int) $row->prompt_tokens,
                'completion_tokens' => (int) $row->completion_tokens,
            ])->values(),
        ]);
    }
}
