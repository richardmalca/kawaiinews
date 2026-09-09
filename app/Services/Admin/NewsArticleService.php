<?php

namespace App\Services\Admin;

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\Tag;
use App\Support\PublicNewsCacheVersion;
use Illuminate\Support\Str;
use Prism\Prism\Facades\Prism;
use Throwable;

class NewsArticleService
{
    public function createFromCluster(NewsCluster $newsCluster): NewsArticle
    {
        $draft = $this->generateDraft($newsCluster);
        $body = $this->appendVideoEmbed($draft['body'], $newsCluster->video_url);

        $newsArticle = NewsArticle::create([
            'news_cluster_id' => $newsCluster->id,
            'title' => $draft['title'],
            'slug' => $this->uniqueSlug($draft['title']),
            'category' => $draft['category'] ?? $newsCluster->category,
            'excerpt' => $draft['excerpt'],
            'body' => $body,
            'featured_image' => $newsCluster->image_url,
            'status' => 'draft',
            'published_at' => $newsCluster->earliestPublishedAt(),
        ]);

        $newsArticle->tags()->sync($this->resolveTagIds($draft['tags']));

        return $newsArticle;
    }

    private function appendVideoEmbed(?string $body, ?string $videoUrl): ?string
    {
        if (! $videoUrl) {
            return $body;
        }

        $videoId = $this->extractYoutubeId($videoUrl);

        if (! $videoId) {
            return $body;
        }

        $embed = '<div class="aspect-video"><iframe src="https://www.youtube.com/embed/'.$videoId.'" title="Video de YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';

        return trim(($body ?? '')."\n\n".$embed);
    }

    private function extractYoutubeId(string $url): ?string
    {
        if (preg_match('#(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})#i', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * @param  array{title: string, category: string, excerpt: ?string, body: ?string, featured_image: ?string, audio_url: ?string, status: string, slug?: ?string}  $data
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
            'audio_url' => $data['audio_url'] ?? null,
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published'
                ? ($newsArticle->published_at ?? now())
                : $newsArticle->published_at,
        ]);

        $newsArticle->save();

        $newsArticle->tags()->sync($this->resolveTagIds($tags));

        PublicNewsCacheVersion::bump();

        return $newsArticle;
    }

    public function toggleStatus(NewsArticle $newsArticle): NewsArticle
    {
        $newsStatus = $newsArticle->status === 'published' ? 'draft' : 'published';

        $newsArticle->update([
            'status' => $newsStatus,
            'published_at' => $newsStatus === 'published'
                ? ($newsArticle->published_at ?? now())
                : $newsArticle->published_at,
        ]);

        PublicNewsCacheVersion::bump();

        return $newsArticle;
    }

    public function delete(NewsArticle $newsArticle): void
    {
        $newsArticle->delete();

        PublicNewsCacheVersion::bump();
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
     * @return array{title: string, excerpt: string|null, body: string|null, category: string|null, tags: array<int, string>}
     */
    private function generateDraft(NewsCluster $newsCluster): array
    {
        $activeProvider = AiProvider::where('is_active', true)->first();

        if (! $activeProvider || ! $activeProvider->hasApiKey()) {
            return [
                'title' => $newsCluster->title,
                'excerpt' => $newsCluster->summary,
                'body' => null,
                'category' => null,
                'tags' => [],
            ];
        }

        try {
            $sourcesSummary = $newsCluster->scrapedItems
                ->map(fn ($item) => "- {$item->newsSource->label}: {$item->title}. {$item->summary}")
                ->implode("\n");

            $categories = implode(', ', array_keys(config('news_sources_catalog')));

            $prompt = <<<PROMPT
                Redacta una noticia en español sobre el siguiente tema, cruzando la información de estas fuentes:

                {$sourcesSummary}

                IMPORTANTE sobre nombres propios: nunca traduzcas ni adaptes títulos de anime/manga/videojuegos, nombres de personajes, estudios, franquicias o marcas: dejalos exactamente como aparecen en las fuentes (ej. "Pretty Cure" se escribe "Pretty Cure", no "Preciosa Cura" ni ninguna traducción; "Re:Zero" queda "Re:Zero"). Solo traducís la prosa alrededor de esos nombres, nunca el nombre en sí.

                Devuelve la respuesta EXACTAMENTE en este formato, sin texto adicional:
                TITULO: (un titular llamativo tipo prensa, distinto y más atractivo que el resumen, no lo repitas)
                RESUMEN: (1 o 2 oraciones que resuman la noticia, sin repetir literalmente el título)
                CUERPO: (HTML válido, 3 a 4 párrafos en tono periodístico neutral. Envuelve cada párrafo en <p>. Usa <strong> para nombres propios y datos clave, <em> para citas textuales o énfasis, <u> para el dato más importante de la noticia, y si hace falta un subtítulo dentro de la nota usa <h3>)
                CATEGORIA: (elegí exactamente una de estas opciones, la que mejor describa el tema principal de la noticia, sin inventar otras: {$categories})
                TAGS: (3 a 6 palabras clave relacionadas, separadas por coma, sin el símbolo # - ej. nombres de personajes, del anime/juego/estudio, del evento. No repitas el título completo como tag)
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
                'category' => null,
                'tags' => [],
            ];
        }
    }

    /**
     * @return array{title: string, excerpt: string|null, body: string|null, category: string|null, tags: array<int, string>}
     */
    private function parseDraft(string $text, NewsCluster $newsCluster): array
    {
        preg_match('/TITULO:\s*(.+)/i', $text, $titleMatch);
        preg_match('/RESUMEN:\s*(.+?)(?=CUERPO:|$)/is', $text, $excerptMatch);
        preg_match('/CUERPO:\s*(.+?)(?=CATEGORIA:|$)/is', $text, $bodyMatch);
        preg_match('/CATEGORIA:\s*(\S+)/i', $text, $categoryMatch);
        preg_match('/TAGS:\s*(.+)/i', $text, $tagsMatch);

        $category = isset($categoryMatch[1]) ? Str::lower(trim($categoryMatch[1], " \t\n\r\0\x0B.")) : null;
        $validCategories = array_keys(config('news_sources_catalog'));

        $tags = isset($tagsMatch[1])
            ? collect(explode(',', $tagsMatch[1]))
                ->map(fn (string $tag) => trim($tag, " \t\n\r\0\x0B#."))
                ->filter()
                ->values()
                ->all()
            : [];

        return [
            'title' => trim($titleMatch[1] ?? $newsCluster->title) ?: $newsCluster->title,
            'excerpt' => isset($excerptMatch[1]) ? trim($excerptMatch[1]) : $newsCluster->summary,
            'body' => isset($bodyMatch[1]) ? trim($bodyMatch[1]) : $text,
            'category' => in_array($category, $validCategories, true) ? $category : null,
            'tags' => $tags,
        ];
    }
}
