<?php

namespace App\Support;

use App\Models\Comment;
use App\Models\NewsCluster;
use Illuminate\Support\Facades\Cache;

/**
 * Contadores para badges de aviso en el sidebar del admin (ej: comentarios
 * bloqueados por la IA esperando revisión). Cacheados brevemente porque se
 * consultan en cada navegación (van en las props compartidas de Inertia),
 * no hace falta que sean exactos al segundo.
 */
class SidebarAlerts
{
    private const BLOCKED_COMMENTS_KEY = 'sidebar:blocked-comments-count';

    public static function blockedCommentsCount(): int
    {
        return Cache::remember(
            self::BLOCKED_COMMENTS_KEY,
            now()->addMinute(),
            fn () => Comment::where('status', 'blocked')->count(),
        );
    }

    public static function bustBlockedCommentsCount(): void
    {
        Cache::forget(self::BLOCKED_COMMENTS_KEY);
    }

    private const HIGH_CREDIBILITY_RUMORS_KEY = 'sidebar:high-credibility-rumors-count';

    /**
     * Rumores que la IA marcó con credibilidad alta (varias fuentes
     * independientes y consistentes) y todavía están sin revisar — vale la
     * pena mirarlos rápido antes de que la noticia se enfríe. No se
     * invalida manualmente como blocked_comments: alcanza con el minuto de
     * cache, es un aviso informativo, no algo que tenga que ser exacto al
     * segundo.
     */
    public static function highCredibilityRumorsCount(): int
    {
        return Cache::remember(
            self::HIGH_CREDIBILITY_RUMORS_KEY,
            now()->addMinute(),
            fn () => NewsCluster::where('status', 'pending')
                ->where('ai_is_rumor', true)
                ->where('ai_credibility', 'alta')
                ->count(),
        );
    }
}
