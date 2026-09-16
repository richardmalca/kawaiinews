<?php

namespace App\Http\Resources\Admin;

use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsClusterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $earliestPublishedAt = $this->earliestPublishedAt();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'summary' => $this->summary,
            'image_url' => $this->image_url,
            'has_video' => filled($this->video_url),
            'sources_count' => $this->sources_count,
            'relevance_score' => $this->relevance_score,
            'status' => $this->status,
            'ai_verdict' => $this->ai_verdict,
            'ai_reason' => $this->ai_reason,
            'ai_is_rumor' => $this->ai_is_rumor,
            'ai_credibility' => $this->ai_credibility,
            'first_seen_at' => $this->first_seen_at?->diffForHumans(),
            'published_at' => $earliestPublishedAt?->diffForHumans(),
            // Para agrupar la bandeja como un calendario ("Hoy", "Ayer",
            // "Esta semana", "Más antiguas") en vez de una tabla plana sin
            // contexto temporal — se calcula sobre la fecha real de
            // publicación de la fuente original si existe, y si no sobre
            // cuándo lo detectó el scraper.
            'date_bucket' => $this->dateBucket($earliestPublishedAt ?? $this->first_seen_at),
            'article_id' => $this->whenLoaded('article', fn () => $this->article?->id),
            'sources' => $this->whenLoaded('scrapedItems', fn () => $this->scrapedItems
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'url' => $item->url,
                    'source_label' => $item->newsSource->label,
                ])
                ->values()),
        ];
    }

    private function dateBucket(?CarbonInterface $date): string
    {
        if (! $date) {
            return 'antes';
        }

        if ($date->isToday()) {
            return 'hoy';
        }

        if ($date->isYesterday()) {
            return 'ayer';
        }

        if ($date->greaterThanOrEqualTo(now()->subDays(7))) {
            return 'semana';
        }

        return 'antes';
    }
}
