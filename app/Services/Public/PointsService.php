<?php

namespace App\Services\Public;

use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Otorga puntos de comunidad por acciones del usuario (ver, reaccionar,
 * acertar trivia). Cada punto queda como una fila en point_transactions
 * para poder sumar por rango de fechas (ranking semanal) sin tocar al
 * usuario directamente.
 */
class PointsService
{
    public const VIEW_ARTICLE = 'view_article';

    public const NEW_REACTION = 'new_reaction';

    public const TRIVIA_CORRECT = 'trivia_correct';

    public const TRIVIA_PARTICIPATION = 'trivia_participation';

    /**
     * @var array<string, int>
     */
    private const POINTS_BY_TYPE = [
        self::VIEW_ARTICLE => 1,
        self::NEW_REACTION => 1,
        self::TRIVIA_CORRECT => 5,
        self::TRIVIA_PARTICIPATION => 1,
    ];

    public function award(User $user, string $type, ?Model $subject = null): PointTransaction
    {
        $transaction = PointTransaction::create([
            'user_id' => $user->id,
            'type' => $type,
            'points' => self::POINTS_BY_TYPE[$type] ?? 0,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
        ]);

        Cache::forget(RankingService::cacheKeyForWeek(now()));

        return $transaction;
    }
}
