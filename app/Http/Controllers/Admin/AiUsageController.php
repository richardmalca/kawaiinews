<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
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

        $byKind = [];
        $totalCost = 0.0;
        $hasUnknownPricing = false;

        foreach ($rows as $row) {
            $pricing = config("ai_pricing.{$row->provider}.{$row->model}");
            $cost = $pricing
                ? ($row->prompt_tokens / 1_000_000 * $pricing['input']) + ($row->completion_tokens / 1_000_000 * $pricing['output'])
                : null;

            if ($cost === null) {
                $hasUnknownPricing = true;
            } else {
                $totalCost += $cost;
            }

            $byKind[$row->kind] ??= ['calls' => 0, 'prompt_tokens' => 0, 'completion_tokens' => 0, 'estimated_cost_usd' => 0.0];
            $byKind[$row->kind]['calls'] += (int) $row->calls;
            $byKind[$row->kind]['prompt_tokens'] += (int) $row->prompt_tokens;
            $byKind[$row->kind]['completion_tokens'] += (int) $row->completion_tokens;
            $byKind[$row->kind]['estimated_cost_usd'] += $cost ?? 0.0;
        }

        return Inertia::render('admin/ai-usage/index', [
            'month' => $startOfMonth->translatedFormat('F Y'),
            'byKind' => $byKind,
            'totalCallsThisMonth' => (int) $rows->sum('calls'),
            'estimatedCostUsd' => round($totalCost, 2),
            'hasUnknownPricing' => $hasUnknownPricing,
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
