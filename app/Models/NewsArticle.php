<?php

namespace App\Models;

use Database\Factories\NewsArticleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Overtrue\LaravelFavorite\Traits\Favoriteable;
use Overtrue\LaravelLike\Traits\Likeable;

/**
 * @property int $id
 * @property int|null $news_cluster_id
 * @property int|null $author_id
 * @property string $title
 * @property string $slug
 * @property string $category
 * @property string|null $excerpt
 * @property string|null $body
 * @property string|null $featured_image
 * @property string|null $audio_url
 * @property string $status
 * @property Carbon|null $published_at
 * @property int $views_count
 */
#[Fillable(['news_cluster_id', 'author_id', 'title', 'slug', 'category', 'excerpt', 'body', 'featured_image', 'audio_url', 'status', 'published_at'])]
class NewsArticle extends Model
{
    /** @use HasFactory<NewsArticleFactory> */
    use Favoriteable, HasFactory, Likeable;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'views_count' => 'integer',
        ];
    }

    public function newsCluster(): BelongsTo
    {
        return $this->belongsTo(NewsCluster::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(Share::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    public function latestAudio(): HasOne
    {
        return $this->hasOne(Media::class)->where('type', 'audio')->latestOfMany();
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
