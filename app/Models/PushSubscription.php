<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $endpoint
 * @property string $endpoint_hash
 * @property string $public_key
 * @property string $auth_token
 * @property string $content_encoding
 * @property Carbon|null $created_at
 */
#[Fillable(['endpoint', 'endpoint_hash', 'public_key', 'auth_token', 'content_encoding'])]
class PushSubscription extends Model
{
    //
}
