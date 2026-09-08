<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $category
 * @property string|null $summary
 * @property string|null $image_url
 * @property int $sources_count
 * @property float $relevance_score
 * @property string $status
 * @property Carbon $first_seen_at
 * @property Carbon $last_seen_at
 */
#[Fillable(['title', 'category', 'summary', 'image_url', 'sources_count', 'relevance_score', 'status', 'first_seen_at', 'last_seen_at'])]
class NewsCluster extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sources_count' => 'integer',
            'relevance_score' => 'float',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function scrapedItems(): HasMany
    {
        return $this->hasMany(ScrapedItem::class);
    }

    public function article(): HasOne
    {
        return $this->hasOne(NewsArticle::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
