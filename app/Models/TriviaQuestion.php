<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['question', 'active_date', 'is_active', 'created_by'])]
class TriviaQuestion extends Model
{
    protected function casts(): array
    {
        return [
            'active_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function options(): HasMany
    {
        return $this->hasMany(TriviaOption::class)->orderBy('position');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(TriviaAnswer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
