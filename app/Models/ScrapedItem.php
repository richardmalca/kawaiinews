<?php

namespace App\Models;

use Database\Factories\ScrapedItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $news_cluster_id
 * @property int $news_source_id
 * @property string $title
 * @property string $url
 * @property string|null $summary
 * @property string|null $image_url
 * @property string|null $video_url
 * @property Carbon|null $published_at
 */
#[Fillable(['news_cluster_id', 'news_source_id', 'title', 'url', 'summary', 'image_url', 'video_url', 'published_at'])]
class ScrapedItem extends Model
{
    /** @use HasFactory<ScrapedItemFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function newsSource(): BelongsTo
    {
        return $this->belongsTo(NewsSource::class);
    }

    public function newsCluster(): BelongsTo
    {
        return $this->belongsTo(NewsCluster::class);
    }
}
