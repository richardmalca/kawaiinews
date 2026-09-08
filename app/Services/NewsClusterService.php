<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Models\NewsCluster;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use Throwable;

class NewsClusterService
{
    public function reviewQueue(string $sort = 'relevance'): Collection
    {
        $clusters = NewsCluster::whereIn('status', ['pending', 'accepted'])
            ->with(['scrapedItems.newsSource', 'article'])
            ->get();

        return match ($sort) {
            'newest' => $clusters->sortByDesc(fn (NewsCluster $cluster) => $cluster->earliestPublishedAt() ?? $cluster->first_seen_at)->values(),
            'oldest' => $clusters->sortBy(fn (NewsCluster $cluster) => $cluster->earliestPublishedAt() ?? $cluster->first_seen_at)->values(),
            default => $clusters->sortByDesc('relevance_score')->values(),
        };
    }

    public function reject(NewsCluster $newsCluster): void
    {
        $newsCluster->update(['status' => 'rejected']);
    }

    public function accept(NewsCluster $newsCluster): NewsCluster
    {
        $newsCluster->update(['status' => 'accepted']);

        return $newsCluster;
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

            {$lines}

            Devuelve EXACTAMENTE una línea por cada ID, en este formato, sin texto adicional:
            ID:VEREDICTO:MOTIVO

            Donde VEREDICTO es PUBLICAR o DESCARTAR, y MOTIVO es una razón de máximo 4 palabras en español (ej: "muy viejo", "poco relevante", "buena cobertura").
            PROMPT;

        $response = Prism::text()
            ->using($activeProvider->provider, $activeProvider->default_model, [
                'api_key' => $activeProvider->api_key,
            ])
            ->withClientOptions(['timeout' => 120])
            ->withPrompt($prompt)
            ->asText();

        return $this->applyAiVerdicts($response->text, $batch);
    }

    private function applyAiVerdicts(string $text, Collection $clusters): int
    {
        $clustersById = $clusters->keyBy('id');
        $analyzed = 0;

        preg_match_all('/ID:\s*(\d+)\s*:\s*(PUBLICAR|DESCARTAR)\s*:\s*(.+)/i', $text, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $cluster = $clustersById->get((int) $match[1]);

            if (! $cluster) {
                continue;
            }

            $cluster->update([
                'ai_verdict' => strtoupper($match[2]) === 'PUBLICAR' ? 'publish' : 'discard',
                'ai_reason' => trim($match[3]),
            ]);

            $analyzed++;
        }

        return $analyzed;
    }
}
