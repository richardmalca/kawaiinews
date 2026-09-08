<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $url
 * @property string|null $original_name
 * @property string $source
 */
#[Fillable(['url', 'original_name', 'source'])]
class Media extends Model
{
    //
}
