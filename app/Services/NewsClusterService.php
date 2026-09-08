<?php

namespace App\Services;

use App\Models\NewsCluster;
use Illuminate\Database\Eloquent\Collection;

class NewsClusterService
{
    public function reviewQueue(): Collection
    {
        return NewsCluster::where('status', 'pending')
            ->with(['scrapedItems.newsSource'])
            ->orderByDesc('relevance_score')
            ->get();
    }

    public function reject(NewsCluster $newsCluster): void
    {
        $newsCluster->update(['status' => 'rejected']);
    }

    public function accept(NewsCluster $newsCluster): NewsCluster
    {
        $newsCluster->update(['status' => 'accepted']);

        return $newsCluster;
    }
}
