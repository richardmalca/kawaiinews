<?php

namespace App\Services\Admin;

use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Models\ScrapedItem;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use SimpleXMLElement;
use Throwable;

class NewsScraperService
{
    private const CLUSTER_WINDOW_DAYS = 4;

    private const SIMILARITY_THRESHOLD = 0.35;

    /**
     * @return array{sources_scraped: int, items_found: int, items_new: int, errors: array<int, string>}
     */
    public function run(): array
    {
        $sources = NewsSource::where('is_active', true)
            ->whereNotNull('rss_url')
            ->get();

        $itemsFound = 0;
        $itemsNew = 0;
        $errors = [];

        foreach ($sources as $source) {
            try {
                $feedItems = $this->fetchFeed($source->rss_url);
                $itemsFound += count($feedItems);

                foreach ($feedItems as $feedItem) {
                    if (ScrapedItem::where('url', $feedItem['url'])->exists()) {
                        continue;
                    }

                    $scrapedItem = ScrapedItem::create([
                        'news_source_id' => $source->id,
                        'title' => $feedItem['title'],
                        'url' => $feedItem['url'],
                        'summary' => $feedItem['summary'],
                        'image_url' => $feedItem['image_url'],
                        'published_at' => $feedItem['published_at'],
                    ]);

                    $this->assignToCluster($scrapedItem, $source->category);
                    $itemsNew++;
                }

                $source->update(['last_scraped_at' => now()]);
            } catch (Throwable $exception) {
                $errors[] = "{$source->label}: {$exception->getMessage()}";
            }
        }

        return [
            'sources_scraped' => $sources->count(),
            'items_found' => $itemsFound,
            'items_new' => $itemsNew,
            'errors' => $errors,
        ];
    }

    /**
     * @return array<int, array{title: string, url: string, summary: string|null, image_url: string|null, published_at: Carbon|null}>
     */
    private function fetchFeed(string $rssUrl): array
    {
        $response = Http::timeout(15)->get($rssUrl);
        $response->throw();

        $xml = $this->parseXml($response->body());
        $items = [];

        foreach ($xml->channel->item ?? [] as $entry) {
            $title = trim((string) $entry->title);
            $link = trim((string) $entry->link);

            if ($title === '' || $link === '') {
                continue;
            }

            $items[] = [
                'title' => Str::limit($title, 250, ''),
                'url' => $link,
                'summary' => $this->extractSummary($entry),
                'image_url' => $this->extractImage($entry),
                'published_at' => $this->parseDate((string) $entry->pubDate),
            ];
        }

        return $items;
    }

    private function parseXml(string $body): SimpleXMLElement
    {
        $sanitized = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $body) ?? $body;

        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();

        try {
            $xml = simplexml_load_string($sanitized, SimpleXMLElement::class, LIBXML_NOCDATA | LIBXML_NOERROR | LIBXML_NOWARNING);

            if ($xml === false) {
                $errors = libxml_get_errors();
                $message = $errors[0]->message ?? 'XML inválido';

                throw new \RuntimeException('No se pudo interpretar el feed RSS: '.trim($message));
            }

            return $xml;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    private function extractSummary(SimpleXMLElement $entry): ?string
    {
        $description = trim((string) $entry->description);

        if ($description === '') {
            return null;
        }

        return Str::limit(strip_tags($description), 500);
    }

    private function extractImage(SimpleXMLElement $entry): ?string
    {
        $enclosure = $entry->enclosure ?? null;

        if ($enclosure !== null && isset($enclosure['url'])) {
            return (string) $enclosure['url'];
        }

        $mediaNamespace = $entry->children('media', true);

        if (isset($mediaNamespace->content) && isset($mediaNamespace->content->attributes()->url)) {
            return (string) $mediaNamespace->content->attributes()->url;
        }

        return null;
    }

    private function parseDate(string $date): ?CarbonInterface
    {
        if ($date === '') {
            return null;
        }

        try {
            return Carbon::parse($date);
        } catch (Throwable) {
            return null;
        }
    }

    private function assignToCluster(ScrapedItem $scrapedItem, string $category): void
    {
        $candidateWords = $this->significantWords($scrapedItem->title);

        $recentClusters = NewsCluster::where('category', $category)
            ->where('last_seen_at', '>=', now()->subDays(self::CLUSTER_WINDOW_DAYS))
            ->get();

        foreach ($recentClusters as $cluster) {
            $similarity = $this->jaccardSimilarity($candidateWords, $this->significantWords($cluster->title));

            if ($similarity >= self::SIMILARITY_THRESHOLD) {
                $this->attachToCluster($scrapedItem, $cluster);

                return;
            }
        }

        $cluster = NewsCluster::create([
            'title' => $scrapedItem->title,
            'category' => $category,
            'summary' => $scrapedItem->summary,
            'image_url' => $scrapedItem->image_url,
            'sources_count' => 1,
            'relevance_score' => $this->calculateRelevance(1, now()),
            'status' => 'pending',
            'first_seen_at' => now(),
            'last_seen_at' => now(),
        ]);

        $scrapedItem->update(['news_cluster_id' => $cluster->id]);
    }

    private function attachToCluster(ScrapedItem $scrapedItem, NewsCluster $cluster): void
    {
        $scrapedItem->update(['news_cluster_id' => $cluster->id]);

        $sourcesCount = $cluster->scrapedItems()->distinct('news_source_id')->count('news_source_id');

        $cluster->update([
            'sources_count' => $sourcesCount,
            'summary' => $cluster->summary ?? $scrapedItem->summary,
            'image_url' => $cluster->image_url ?? $scrapedItem->image_url,
            'relevance_score' => $this->calculateRelevance($sourcesCount, $cluster->first_seen_at),
            'last_seen_at' => now(),
        ]);
    }

    private function calculateRelevance(int $sourcesCount, CarbonInterface $firstSeenAt): float
    {
        $hoursSinceFirstSeen = max(1, $firstSeenAt->diffInHours(now()));
        $recencyBonus = 1 / $hoursSinceFirstSeen;

        return round(($sourcesCount * 10) + $recencyBonus, 4);
    }

    /**
     * @return array<int, string>
     */
    private function significantWords(string $title): array
    {
        $stopWords = ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'en', 'a', 'un', 'una', 'con', 'por', 'para', 'que', 'su', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'and', 'for'];

        $normalized = Str::lower(Str::ascii($title));
        $words = preg_split('/[^a-z0-9]+/', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return array_values(array_diff($words, $stopWords));
    }

    /**
     * @param  array<int, string>  $wordsA
     * @param  array<int, string>  $wordsB
     */
    private function jaccardSimilarity(array $wordsA, array $wordsB): float
    {
        if (count($wordsA) === 0 || count($wordsB) === 0) {
            return 0.0;
        }

        $intersection = count(array_intersect($wordsA, $wordsB));
        $union = count(array_unique(array_merge($wordsA, $wordsB)));

        return $union === 0 ? 0.0 : $intersection / $union;
    }
}
