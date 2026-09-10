<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Overtrue\LaravelFollow\Traits\Followable;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 */
#[Fillable(['name', 'slug'])]
class Tag extends Model
{
    use Followable;

    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(NewsArticle::class);
    }
}
