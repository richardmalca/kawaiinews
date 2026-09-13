<?php

namespace App\Support;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Registro simple de "quién hizo qué" en el panel admin — para cuando haya
 * más de un editor y haga falta saber quién aceptó/rechazó/editó algo.
 * A propósito no es un observer automático: se llama explícitamente desde
 * cada acción para poder escribir una descripción legible en español.
 */
class ActivityLogger
{
    public static function log(string $action, ?Model $subject = null, ?string $description = null, ?int $userId = null): void
    {
        ActivityLog::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'description' => $description,
            'created_at' => now(),
        ]);
    }
}
