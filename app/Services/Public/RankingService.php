<?php

namespace App\Services\Public;

use App\Models\PointTransaction;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Ranking semanal de puntos de comunidad. El top se calcula una sola vez
 * por semana y se cachea -- PointsService::award() invalida ese caché
 * apenas se suma un punto nuevo, así que siempre se recalcula fresco en
 * la próxima lectura en vez de esperar un TTL. El TTL de una hora es solo
 * un respaldo por si el forget falla.
 */
class RankingService
{
    private const TOP_LIMIT = 20;

    public static function cacheKeyForWeek(CarbonInterface $moment): string
    {
        return 'ranking:semana:'.$moment->copy()->startOfWeek()->format('Y-m-d');
    }

    /**
     * @return array<int, array{user_id: int, name: string, username: ?string, avatar: ?string, badge: ?array, points: int, rank: int}>
     */
    public function weeklyTop(): array
    {
        return Cache::remember(self::cacheKeyForWeek(now()), 3600, function () {
            [$start, $end] = $this->currentWeekRange();

            $rows = PointTransaction::query()
                ->select('user_id')
                ->selectRaw('sum(points) as total_points')
                ->whereBetween('created_at', [$start, $end])
                ->groupBy('user_id')
                ->orderByDesc('total_points')
                ->limit(self::TOP_LIMIT)
                ->with('user:id,name,username,avatar,custom_avatar,avatar_source')
                ->get();

            return $rows->values()->map(function (PointTransaction $row, int $index) {
                $user = $row->user;

                return [
                    'user_id' => $row->user_id,
                    'name' => $user?->name ?? 'Usuario',
                    'username' => $user?->username,
                    'avatar' => $user?->active_avatar_url,
                    'badge' => $user?->community_badge,
                    'points' => (int) $row->total_points,
                    'rank' => $index + 1,
                ];
            })->all();
        });
    }

    /**
     * Posición del usuario en la semana actual, aunque no esté en el
     * top. Se calcula al vuelo (no cacheado): es una sola consulta
     * indexada por user_id + created_at, barata comparada con el
     * agregado completo del top.
     *
     * @return array{points: int, rank: ?int}
     */
    public function myPosition(User $user): array
    {
        [$start, $end] = $this->currentWeekRange();

        $myPoints = (int) PointTransaction::query()
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$start, $end])
            ->sum('points');

        if ($myPoints === 0) {
            return ['points' => 0, 'rank' => null];
        }

        // ->count() con groupBy() en el query builder cuenta filas por
        // grupo, no la cantidad de grupos -- por eso se trae con get() y
        // se cuenta la colección resultante.
        $usersAhead = DB::table('point_transactions')
            ->select('user_id')
            ->selectRaw('sum(points) as total_points')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('user_id')
            ->havingRaw('sum(points) > ?', [$myPoints])
            ->get()
            ->count();

        return ['points' => $myPoints, 'rank' => $usersAhead + 1];
    }

    /**
     * @return array{0: CarbonInterface, 1: CarbonInterface}
     */
    private function currentWeekRange(): array
    {
        return [now()->startOfWeek(), now()->endOfWeek()];
    }
}
