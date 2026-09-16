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

    public function reviewQueue(string $sort = 'relevance', ?string $category = null, int $perPage = 20, int $page = 1, ?string $search = null): LengthAwarePaginator
    {
        $query = NewsCluster::query()
            ->selectRaw('news_clusters.*, '.self::EARLIEST_PUBLISHED_AT_SQL.' as earliest_published_at')
            ->whereIn('status', ['pending', 'accepted'])
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

    private const BATCH_SIZE = 100;

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
            Sos un editor de noticias de anime/geek/gaming. Evaluá cada uno de estos temas y decidí si vale la pena publicarlos como noticia hoy o descartarlos (por ser viejos, poco relevantes, muy de nicho o triviales). Más fuentes cubriendo el mismo tema y menor antigüedad es mejor señal.

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
