<?php

namespace App\Services\Public;

use App\Models\NewsArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Cuenta vistas de artículos sin pegarle a la tabla `news_articles` en cada
 * request. Cada visita única (por visitante, deduplicada un rato) suma a un
 * contador en caché; un comando programado (`views:flush`) vuelca esos
 * contadores a la base en lote cada minuto con una sola query por artículo
 * (UPDATE ... SET views_count = views_count + N), sin tocar `updated_at`
 * porque usa el query builder plano, no Eloquent.
 */
class ArticleViewService
{
    private const DEDUPE_TTL_MINUTES = 30;

    private const PENDING_IDS_KEY = 'article-views:pending-ids';

    /**
     * Registra una vista si este visitante no vio el artículo en los
     * últimos 30 minutos. No escribe en la base todavía.
     */
    public function record(NewsArticle $article, Request $request): void
    {
        $dedupeKey = 'article-view-seen:'.$article->id.':'.$this->viewerFingerprint($request);

        if (Cache::has($dedupeKey)) {
            return;
        }

        Cache::put($dedupeKey, true, now()->addMinutes(self::DEDUPE_TTL_MINUTES));

        $pendingKey = 'article-views:pending:'.$article->id;

        Cache::add($pendingKey, 0, now()->addHours(2));
        Cache::increment($pendingKey);

        $this->markPending($article->id);
    }

    /**
     * Vuelca todos los contadores pendientes a `news_articles.views_count`
     * en una sola pasada. Pensado para correr cada minuto vía scheduler.
     *
     * @return int cantidad de artículos actualizados
     */
    public function flushPending(): int
    {
        $pendingIds = Cache::lock('article-views:pending-ids-lock', 5)->block(5, function () {
            $ids = Cache::get(self::PENDING_IDS_KEY, []);
            Cache::forget(self::PENDING_IDS_KEY);

            return $ids;
        });

        if (empty($pendingIds)) {
            return 0;
        }

        $flushed = 0;

        foreach ($pendingIds as $articleId) {
            $key = 'article-views:pending:'.$articleId;

            $count = Cache::lock($key.':lock', 5)->block(5, function () use ($key) {
                $value = Cache::get($key, 0);
                Cache::forget($key);

                return $value;
            });

            if ($count <= 0) {
                continue;
            }

            DB::table('news_articles')
                ->where('id', $articleId)
                ->increment('views_count', $count);

            $flushed++;
        }

        return $flushed;
    }

    private function markPending(int $articleId): void
    {
        Cache::lock('article-views:pending-ids-lock', 5)->block(5, function () use ($articleId) {
            $pendingIds = Cache::get(self::PENDING_IDS_KEY, []);

            if (! in_array($articleId, $pendingIds, true)) {
                $pendingIds[] = $articleId;
                Cache::put(self::PENDING_IDS_KEY, $pendingIds, now()->addHours(2));
            }
        });
    }

    private function viewerFingerprint(Request $request): string
    {
        return hash('sha256', $request->ip().'|'.$request->userAgent());
    }
}
