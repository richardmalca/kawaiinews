<?php

namespace App\Models;

use Database\Factories\RadioQueueItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $position
 * @property string $type
 * @property int|null $radio_track_id
 * @property int|null $news_article_id
 * @property string $title
 * @property string $audio_url
 * @property int|null $duration_seconds
 */
#[Fillable(['position', 'type', 'radio_track_id', 'news_article_id', 'title', 'audio_url', 'duration_seconds'])]
class RadioQueueItem extends Model
{
    /** @use HasFactory<RadioQueueItemFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'duration_seconds' => 'integer',
        ];
    }

    public function radioTrack(): BelongsTo
    {
        return $this->belongsTo(RadioTrack::class);
    }

    public function newsArticle(): BelongsTo
    {
        return $this->belongsTo(NewsArticle::class);
    }
}
