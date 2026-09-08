<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $news_cluster_id
 * @property string $title
 * @property string $slug
 * @property string $category
 * @property string|null $excerpt
 * @property string|null $body
 * @property string|null $featured_image
 * @property string $status
 * @property Carbon|null $published_at
 */
#[Fillable(['news_cluster_id', 'title', 'slug', 'category', 'excerpt', 'body', 'featured_image', 'status', 'published_at'])]
class NewsArticle extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function newsCluster(): BelongsTo
    {
        return $this->belongsTo(NewsCluster::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
