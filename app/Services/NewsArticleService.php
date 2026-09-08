<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\Tag;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use Throwable;

class NewsArticleService
{
    public function createFromCluster(NewsCluster $newsCluster): NewsArticle
    {
        $draft = $this->generateDraft($newsCluster);

        return NewsArticle::create([
            'news_cluster_id' => $newsCluster->id,
            'title' => $draft['title'],
            'slug' => $this->uniqueSlug($draft['title']),
            'category' => $newsCluster->category,
            'excerpt' => $draft['excerpt'],
            'body' => $draft['body'],
            'featured_image' => $newsCluster->image_url,
            'status' => 'draft',
        ]);
    }

    /**
     * @param  array{title: string, category: string, excerpt: ?string, body: ?string, featured_image: ?string, status: string, slug?: ?string}  $data
     * @param  array<int, string>  $tags
     */
    public function save(NewsArticle $newsArticle, array $data, array $tags = []): NewsArticle
    {
        $slug = filled($data['slug'] ?? null)
            ? Str::slug($data['slug'])
            : $newsArticle->slug;

        if ($slug !== $newsArticle->slug) {
            $slug = $this->uniqueSlug($slug, $newsArticle->id);
        }

        $newsArticle->fill([
            'title' => $data['title'],
            'slug' => $slug,
            'category' => $data['category'],
            'excerpt' => $data['excerpt'] ?? null,
            'body' => $data['body'] ?? null,
            'featured_image' => $data['featured_image'] ?? null,
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published' ? ($newsArticle->published_at ?? now()) : null,
        ]);

        $newsArticle->save();

        $newsArticle->tags()->sync($this->resolveTagIds($tags));

        return $newsArticle;
    }

    public function delete(NewsArticle $newsArticle): void
    {
        $newsArticle->delete();
    }

    /**
     * @return array<int, int>
     */
    private function resolveTagIds(array $tags): array
    {
        return collect($tags)
            ->filter(fn (string $name) => filled($name))
            ->map(function (string $name) {
                $tag = Tag::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => trim($name)],
                );

                return $tag->id;
            })
            ->values()
            ->all();
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $suffix = 1;

        while (
            NewsArticle::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    /**
     * @return array{title: string, excerpt: string|null, body: string|null}
     */
    private function generateDraft(NewsCluster $newsCluster): array
    {
        $activeProvider = AiProvider::where('is_active', true)->first();

        if (! $activeProvider || ! $activeProvider->hasApiKey()) {
            return [
                'title' => $newsCluster->title,
                'excerpt' => $newsCluster->summary,
                'body' => null,
            ];
        }

        try {
            $sourcesSummary = $newsCluster->scrapedItems
                ->map(fn ($item) => "- {$item->newsSource->label}: {$item->title}. {$item->summary}")
                ->implode("\n");

            $prompt = <<<PROMPT
                Redacta una noticia en español sobre el siguiente tema, cruzando la información de estas fuentes:

                {$sourcesSummary}

                Devuelve la respuesta EXACTAMENTE en este formato, sin texto adicional:
                TITULO: (un titular llamativo tipo prensa, distinto y más atractivo que el resumen, no lo repitas)
                RESUMEN: (1 o 2 oraciones que resuman la noticia, sin repetir literalmente el título)
                CUERPO: (3 a 4 párrafos en tono periodístico neutral, separados por saltos de línea. Usa formato: **negrita** para nombres propios y datos clave, *cursiva* para citas textuales o énfasis, y <u>subrayado</u> para el dato más importante de la noticia)
                PROMPT;

            $response = Prism::text()
                ->using($activeProvider->provider, $activeProvider->default_model, [
                    'api_key' => $activeProvider->api_key,
                ])
                ->withPrompt($prompt)
                ->asText();

            return $this->parseDraft($response->text, $newsCluster);
        } catch (Throwable) {
            return [
                'title' => $newsCluster->title,
                'excerpt' => $newsCluster->summary,
                'body' => null,
            ];
        }
    }

    /**
     * @return array{title: string, excerpt: string|null, body: string|null}
     */
    private function parseDraft(string $text, NewsCluster $newsCluster): array
    {
        preg_match('/TITULO:\s*(.+)/i', $text, $titleMatch);
        preg_match('/RESUMEN:\s*(.+?)(?=CUERPO:|$)/is', $text, $excerptMatch);
        preg_match('/CUERPO:\s*(.+)/is', $text, $bodyMatch);

        return [
            'title' => trim($titleMatch[1] ?? $newsCluster->title) ?: $newsCluster->title,
            'excerpt' => isset($excerptMatch[1]) ? trim($excerptMatch[1]) : $newsCluster->summary,
            'body' => isset($bodyMatch[1]) ? trim($bodyMatch[1]) : $text,
        ];
    }
}
