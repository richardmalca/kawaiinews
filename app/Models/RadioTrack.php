<?php

namespace App\Models;

use Database\Factories\RadioTrackFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $title
 * @property string|null $artist
 * @property string $url
 * @property int|null $duration_seconds
 * @property bool $active
 */
#[Fillable(['title', 'artist', 'url', 'duration_seconds', 'active'])]
class RadioTrack extends Model
{
    /** @use HasFactory<RadioTrackFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'duration_seconds' => 'integer',
        ];
    }

    public function queueItems(): HasMany
    {
        return $this->hasMany(RadioQueueItem::class);
    }
}
