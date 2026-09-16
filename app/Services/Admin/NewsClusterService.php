<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\NewsCluster;
use App\Models\SiteSetting;
use App\Support\AiUsageLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use Throwable;

class NewsClusterService
{
    public function __construct(private readonly NewsArticleService $newsArticleService) {}

    private const EARLIEST_PUBLISHED_AT_SQL = '(select min(published_at) from scraped_items where scraped_items.news_cluster_id = news_clusters.id)';

    /**
     * @param  string  $view  'pending' (default, lo que todavía no está publicado en el sitio, para revisar/decidir) o 'published' (lo que ya se convirtió en artículo publicado, solo para consulta)
     */
    public function reviewQueue(string $sort = 'relevance', ?string $category = null, int $perPage = 20, int $page = 1, ?string $search = null, string $view = 'pending'): LengthAwarePaginator
    {
        $query = NewsCluster::query()
            ->selectRaw('news_clusters.*, '.self::EARLIEST_PUBLISHED_AT_SQL.' as earliest_published_at')
            ->whereIn('status', ['pending', 'accepted'])
            ->when(
                $view === 'published',
                fn ($q) => $q->whereHas('article', fn ($aq) => $aq->where('status', 'published')),
                fn ($q) => $q->where(fn ($qq) => $qq->whereDoesntHave('article', fn ($aq) => $aq->where('status', 'published')))
            )
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($search, fn ($q) => $q->where('title', 'like', '%'.$search.'%'))
            ->with(['scrapedItems.newsSource', 'article']);

        match ($sort) {
            'newest' => $query->orderByRaw('coalesce('.self::EARLIEST_PUBLISHED_AT_SQL.', first_seen_at) desc'),
            'oldest' => $query->orderByRaw('coalesce('.self::EARLIEST_PUBLISHED_AT_SQL.', first_seen_at) asc'),
            default => $query->orderByDesc('relevance_score'),
        };

        return $query->paginate($perPage, page: $page);
    }

    /**
     * KPIs sobre el mismo alcance que la bandeja (pending + accepted, con
     * el mismo filtro de categoría si hay uno activo) — no sobre todos los
     * clusters históricos, para que coincida con lo que el admin está
     * viendo en la tabla.
     *
     * @return array{total: int, published: int, unpublished: int, analyzed: int}
     */
    public function adminKpis(?string $category = null): array
    {
        $scope = fn () => NewsCluster::query()
            ->whereIn('status', ['pending', 'accepted'])
            ->when($category, fn ($query) => $query->where('category', $category));

        $total = $scope()->count();

        // "Publicada" = el cluster ya se aceptó Y el artículo que generó
        // está publicado en el sitio (no solo aceptado/borrador todavía).
        $published = $scope()
            ->where('status', 'accepted')
            ->whereHas('article', fn ($query) => $query->where('status', 'published'))
            ->count();

        return [
            'total' => $total,
            'published' => $published,
            // Todo lo que sigue en la bandeja sin ser un artículo publicado
            // todavía: pendientes de revisar + aceptados que quedaron en
            // borrador sin publicar.
            'unpublished' => $total - $published,
            'analyzed' => $scope()->whereNotNull('ai_verdict')->count(),
        ];
    }

    public function reject(NewsCluster $newsCluster): void
    {
        $newsCluster->update(['status' => 'rejected']);
    }

    /**
     * Deshace un rechazo reciente, devolviendo el cluster a la bandeja
     * (`pending`). Solo tiene sentido si sigue `rejected` — si mientras
     * tanto se lo volvió a procesar de otra forma, no lo tocamos.
     */
    public function restore(NewsCluster $newsCluster): void
    {
        if ($newsCluster->status !== 'rejected') {
            return;
        }

        $newsCluster->update(['status' => 'pending']);
    }

    /**
     * Fusiona dos clusters que en realidad son la misma noticia (el scraper
     * a veces los separa si el título varía mucho entre fuentes). Mueve las
     * fuentes de `$source` a `$target` y descarta `$source` (queda como
     * `rejected`, recuperable con restore() si fue un error).
     */
    public function merge(NewsCluster $source, NewsCluster $target): NewsCluster
    {
        $source->scrapedItems()->update(['news_cluster_id' => $target->id]);

        $target->update([
            'sources_count' => $target->scrapedItems()->distinct('news_source_id')->count('news_source_id'),
            'relevance_score' => max($target->relevance_score, $source->relevance_score),
        ]);

        $this->reject($source);

        return $target->fresh();
    }

    public function accept(NewsCluster $newsCluster): NewsCluster
    {
        $newsCluster->update(['status' => 'accepted']);

        return $newsCluster;
    }

    /**
     * Acepta y convierte en artículo todos los clusters `pending` que la IA
     * marcó como `publish`, de una sola vez. Cada conversión sigue llamando
     * a la IA para redactar el borrador (vía `createFromCluster`), así que
     * esto se dispara desde una cola (`ApplyAiVerdictsJob`), no en el
     * request HTTP, igual que el scraping y el análisis en lote.
     *
     * @return array{applied: int, article_ids: array<int, int>}
     */
    public function acceptAllPublishVerdicts(?int $limit = null): array
    {
        $query = NewsCluster::where('status', 'pending')
            ->where('ai_verdict', 'publish')
            ->orderByDesc('relevance_score');

        if ($limit !== null) {
            $query->limit($limit);
        }

        $articleIds = [];

        foreach ($query->get() as $cluster) {
            $this->accept($cluster);
            $article = $this->newsArticleService->createFromCluster($cluster);
            $articleIds[] = $article->id;
        }

        return ['applied' => count($articleIds), 'article_ids' => $articleIds];
    }

    /**
     * Cuántos clusters se aceptan como máximo en una sola corrida del
     * comando programado — así, aunque el tope diario sea 5, no se
     * publican las 5 de golpe: el comando corre varias veces al día (ver
     * routes/console.php) y va soltando de a una, repartidas en el
     * tiempo, hasta agotar el tope diario.
     */
    private const AUTO_ACCEPT_PER_RUN_LIMIT = 1;

    /**
     * Versión acotada de acceptAllPublishVerdicts() para el comando
     * programado (news:auto-accept, corre varias veces al día): solo
     * corre si el admin lo activó explícitamente, y solo toma como
     * mucho AUTO_ACCEPT_PER_RUN_LIMIT por corrida, sin pasarse del tope
     * diario configurado — cuenta lo ya aceptado hoy (status accepted,
     * actualizado hoy) para saber cuánto margen le queda. Así la
     * redacción automática queda funcionando sola pero repartida a lo
     * largo del día en vez de todas juntas a la misma hora.
     *
     * @return array{applied: int, article_ids: array<int, int>}
     */
    public function autoAcceptDaily(): array
    {
        $settings = SiteSetting::current();

        if (! $settings->auto_accept_news_enabled) {
            return ['applied' => 0, 'article_ids' => []];
        }

        $acceptedToday = NewsCluster::where('status', 'accepted')
            ->whereDate('updated_at', today())
            ->count();

        $remainingToday = max(0, $settings->auto_accept_news_daily_limit - $acceptedToday);

        if ($remainingToday === 0) {
            return ['applied' => 0, 'article_ids' => []];
        }

        $limit = min($remainingToday, self::AUTO_ACCEPT_PER_RUN_LIMIT);

        return $this->acceptAllPublishVerdicts($limit);
    }

    public function autoRejectDiscarded(): int
    {
        return NewsCluster::where('status', 'pending')
            ->where('ai_verdict', 'discard')
            ->update(['status' => 'rejected']);
    }

    /**
     * Días que un cluster puede quedar `pending` sin publicarse antes de
     * descartarse solo, sin importar su veredicto — una noticia de anime de
     * hace más de una semana ya no tiene sentido publicarla como novedad, y
     * sin este corte la bandeja se llena de temas viejos que nadie va a
     * aceptar nunca a mano.
     */
    private const STALE_AFTER_DAYS = 5;

    public function autoRejectStale(): int
    {
        return NewsCluster::where('status', 'pending')
            ->where('first_seen_at', '<', now()->subDays(self::STALE_AFTER_DAYS))
            ->update(['status' => 'rejected']);
    }

    // Lotes chicos: con 100 títulos por llamada la respuesta a veces se
    // cuelga (probablemente por el tamaño de la salida estructurada que
    // tiene que generar); con 30 responde en unos segundos de forma
    // confiable.
    private const BATCH_SIZE = 30;

    /**
     * Días hacia atrás en los que tiene sentido buscar duplicados — más
     * allá de eso ya se rechazan por antigüedad (ver autoRejectStale), no
     * hace falta gastar en compararlos.
     */
    private const MERGE_LOOKBACK_DAYS = 2;

    /**
     * Detecta con IA clusters `pending` que en realidad son la misma
     * noticia real cubierta con títulos distintos por distintas fuentes
     * (el scraper a veces los separa) y los fusiona solo, sin que el admin
     * tenga que hacerlo a mano desde "Fusionar con...". Importa hacerlo
     * ANTES de analyzeWithAi(): una noticia de una sola fuente puede en
     * realidad tener varias fuentes repartidas en clusters separados, y
     * sin fusionar antes esa cobertura real no se refleja en
     * `sources_count`/`relevance_score` a la hora de decidir si vale la
     * pena publicarla.
     *
     * @return int cuántos clusters se fusionaron (quedaron `rejected`, no cuántos grupos)
     */
    public function autoMergeDuplicates(): int
    {
        $activeProvider = AiProvider::where('is_active', true)->first();

        if (! $activeProvider || ! $activeProvider->hasApiKey()) {
            return 0;
        }

        $merged = 0;

        $clusters = NewsCluster::where('status', 'pending')
            ->where('first_seen_at', '>=', now()->subDays(self::MERGE_LOOKBACK_DAYS))
            ->get()
            ->groupBy('category');

        foreach ($clusters as $categoryClusters) {
            foreach ($categoryClusters->chunk(self::BATCH_SIZE) as $batch) {
                if ($batch->count() < 2) {
                    continue;
                }

                try {
                    $merged += $this->mergeDuplicatesInBatch($batch, $activeProvider);
                } catch (Throwable) {
                    // Si falla un lote seguimos con el resto — fusionar es
                    // una mejora, no algo crítico como para frenar todo
                    // news:auto-review por un error de un lote.
                }
            }
        }

        return $merged;
    }

    private function mergeDuplicatesInBatch(Collection $batch, AiProvider $activeProvider): int
    {
        $lines = $batch->map(fn (NewsCluster $cluster) => "ID:{$cluster->id} | ".Str::limit($cluster->title, 100, ''))->implode("\n");

        $prompt = <<<PROMPT
            Estas son noticias pendientes de revisión, todas de la misma categoría. El sistema que las agrupó por fuente a veces separa en dos o más la MISMA noticia real cuando el título varía entre fuentes. Encontrá esos casos.

            {$lines}

            Devolvé SOLO una línea por cada grupo de 2 o más IDs que sean el mismo hecho real, en este formato exacto, sin texto adicional:
            GRUPO:id1,id2,id3

            Si dos noticias son parecidas pero son hechos distintos (ej. dos anuncios distintos del mismo anime), NO los agrupes. Si ninguno es duplicado de otro, no devuelvas ninguna línea.
            PROMPT;

        $response = Prism::text()
            ->using($activeProvider->provider, $activeProvider->default_model, [
                'api_key' => $activeProvider->api_key,
            ])
            ->withClientOptions(['timeout' => 60])
            ->withPrompt($prompt)
            ->asText();

        AiUsageLogger::record('analyze', $activeProvider->provider, $activeProvider->default_model, $response->usage);

        return $this->applyMergeGroups($response->text, $batch);
    }

    private function applyMergeGroups(string $text, Collection $batch): int
    {
        $clustersById = $batch->keyBy('id');
        $merged = 0;

        preg_match_all('/GRUPO:\s*([\d,\s]+)/i', $text, $matches);

        foreach ($matches[1] as $rawGroup) {
            $groupClusters = collect(explode(',', $rawGroup))
                ->map(fn ($id) => $clustersById->get((int) trim($id)))
                ->filter()
                ->values();

            if ($groupClusters->count() < 2) {
                continue;
            }

            $target = $groupClusters->sortByDesc('relevance_score')->first();

            foreach ($groupClusters as $cluster) {
                if ($cluster->id === $target->id) {
                    continue;
                }

                // Puede que ya se haya fusionado en otro grupo de este
                // mismo lote (si la IA lo repitió) — nos aseguramos de que
                // siga pending antes de tocarlo.
                if ($cluster->fresh()->status !== 'pending') {
                    continue;
                }

                $target = $this->merge($cluster, $target);
                $merged++;
            }
        }

        return $merged;
    }

    /**
     * @return array{analyzed: int, error: ?string}
     */
    public function analyzeWithAi(): array
    {
        $clusters = NewsCluster::where('status', 'pending')
            ->whereNull('ai_verdict')
            ->get();

        if ($clusters->isEmpty()) {
            return ['analyzed' => 0, 'error' => null];
        }

        $activeProvider = AiProvider::where('is_active', true)->first();

        if (! $activeProvider || ! $activeProvider->hasApiKey()) {
            return ['analyzed' => 0, 'error' => 'No hay un proveedor de IA activo con API key configurada.'];
        }

        $totalAnalyzed = 0;

        foreach ($clusters->chunk(self::BATCH_SIZE) as $batch) {
            try {
                $totalAnalyzed += $this->analyzeBatch($batch, $activeProvider);
            } catch (Throwable $exception) {
                return [
                    'analyzed' => $totalAnalyzed,
                    'error' => $totalAnalyzed > 0
                        ? "Se analizaron {$totalAnalyzed} antes de un error: {$exception->getMessage()}"
                        : "No se pudo analizar: {$exception->getMessage()}",
                ];
            }
        }

        return ['analyzed' => $totalAnalyzed, 'error' => null];
    }

    private function analyzeBatch(Collection $batch, AiProvider $activeProvider): int
    {
        $lines = $batch->map(function (NewsCluster $cluster) {
            $ageDays = $cluster->first_seen_at->diffInDays(now());
            $title = Str::limit($cluster->title, 100, '');

            return "ID:{$cluster->id} | Categoría: {$cluster->category} | Fuentes: {$cluster->sources_count} | Antigüedad: {$ageDays} días | Título: {$title}";
        })->implode("\n");

        $prompt = <<<PROMPT
            Sos el editor de KawaiiNews, un sitio de noticias enfocado específicamente en ANIME, MANGA y CULTURA JAPONESA (videojuegos japoneses, películas japonesas o directamente relacionadas con anime/manga, y noticias de Japón en general). NO es un sitio genérico de geek, gaming o cine occidental.

            Las fuentes que alimentan este sistema incluyen sitios genéricos de tecnología (Kotaku, IGN, Xataka), gaming (Vandal, Eurogamer, 3DJuegos) y cine (Sensacine, Espinof) que también publican mucho contenido que NO tiene nada que ver con anime ni Japón (política, hardware genérico, cine de Hollywood, deportes electrónicos occidentales, etc.). Tu trabajo es filtrar eso con criterio estricto: DESCARTAR cualquier tema que no esté claramente relacionado con anime, manga, videojuegos japoneses/desarrollados en Japón, cine japonés, o cultura/noticias de Japón — sin importar que venga catalogado como "geek", "gaming" o "películas". Ante la duda de si algo es realmente sobre Japón/anime o no, descartalo.

            Para lo que sí sea relevante, evaluá además si vale la pena publicarlo hoy o descartarlo por ser viejo, poco relevante, muy de nicho o trivial. Más fuentes cubriendo el mismo tema y menor antigüedad es mejor señal.

            Además, para cada uno indicá si se presenta como un RUMOR o reporte sin confirmar (a diferencia de un anuncio oficial ya confirmado por el estudio/desarrollador/editorial) y, si es rumor, tu estimación de qué tan creíble parece SOLO en base a la cantidad y calidad de las fuentes que lo cubren acá (no tenés acceso a internet en vivo, no estás verificando el hecho en sí — es una estimación por cobertura y consistencia entre fuentes, no una confirmación real).

            {$lines}

            Devuelve EXACTAMENTE una línea por cada ID, en este formato, sin texto adicional:
            ID:VEREDICTO:MOTIVO:RUMOR:CREDIBILIDAD

            Donde:
            - VEREDICTO es PUBLICAR o DESCARTAR.
            - MOTIVO es una razón de máximo 4 palabras en español (ej: "muy viejo", "poco relevante", "buena cobertura").
            - RUMOR es SI o NO.
            - CREDIBILIDAD es ALTA, MEDIA o BAJA si RUMOR es SI (según cuántas fuentes independientes lo cubren y qué tan consistentes son entre sí), o NA si RUMOR es NO.
            PROMPT;

        $response = Prism::text()
            ->using($activeProvider->provider, $activeProvider->default_model, [
                'api_key' => $activeProvider->api_key,
            ])
            ->withClientOptions(['timeout' => 120])
            ->withPrompt($prompt)
            ->asText();

        AiUsageLogger::record('analyze', $activeProvider->provider, $activeProvider->default_model, $response->usage);

        return $this->applyAiVerdicts($response->text, $batch);
    }

    private function applyAiVerdicts(string $text, Collection $clusters): int
    {
        $clustersById = $clusters->keyBy('id');
        $analyzed = 0;

        // RUMOR:CREDIBILIDAD son opcionales al final por si el modelo
        // devuelve el formato viejo (ID:VEREDICTO:MOTIVO) sin esos campos
        // — mejor guardar lo que sí vino que descartar la línea entera.
        preg_match_all('/ID:\s*(\d+)\s*:\s*(PUBLICAR|DESCARTAR)\s*:\s*([^:\n]+?)(?:\s*:\s*(SI|NO)\s*:\s*(ALTA|MEDIA|BAJA|NA))?\s*$/im', $text, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $cluster = $clustersById->get((int) $match[1]);

            if (! $cluster) {
                continue;
            }

            $isRumor = isset($match[4]) ? strtoupper($match[4]) === 'SI' : null;
            $credibility = isset($match[5]) && strtoupper($match[5]) !== 'NA'
                ? strtolower($match[5])
                : null;

            $cluster->update([
                'ai_verdict' => strtoupper($match[2]) === 'PUBLICAR' ? 'publish' : 'discard',
                'ai_reason' => trim($match[3]),
                'ai_is_rumor' => $isRumor,
                'ai_credibility' => $isRumor ? $credibility : null,
            ]);

            $analyzed++;
        }

        return $analyzed;
    }
}
