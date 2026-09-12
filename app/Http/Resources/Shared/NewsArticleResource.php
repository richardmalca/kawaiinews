<?php

namespace App\Http\Resources\Shared;

use App\Models\ArticleReaction;
use App\Services\Public\ArticleInteractionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsArticleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'featured_image' => $this->resolveMediaUrl($this->featured_image),
            'status' => $this->status,
            'views_count' => $this->views_count,
            'published_at' => $this->published_at?->diffForHumans(),
            'published_at_formatted' => $this->published_at?->translatedFormat('d \d\e F, Y'),
            'published_at_time' => $this->published_at?->format('H:i'),
            'published_at_iso' => $this->published_at?->toIso8601String(),
            'updated_at_iso' => $this->updated_at?->toIso8601String(),
            'created_at' => $this->created_at?->diffForHumans(),
            'canonical_url' => url("/noticias/{$this->slug}"),
            'audio_url' => $this->resolveMediaUrl($this->audio_url),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')->values()),
            'tag_items' => $this->whenLoaded('tags', fn () => $this->tags->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
            ])->values()),
            'author' => $this->whenLoaded('author', fn () => $this->author ? [
                'id' => $this->author->id,
                'name' => $this->author->name,
                'username' => $this->author->username,
            ] : null),
            'likers_count' => (int) ($this->likers_count ?? $this->likers()->count()),
            'favorites_count' => (int) ($this->favorites_count ?? $this->favoriters()->count()),
            'shares_count' => (int) ($this->shares_count ?? $this->shares()->count()),
            'comments_count' => (int) ($this->comments_count ?? $this->comments()->count()),
            'has_liked' => $request->user() ? $request->user()->hasLiked($this->resource) : false,
            'has_favorited' => $request->user() ? $request->user()->hasFavorited($this->resource) : false,
            'reactions' => app(ArticleInteractionService::class)->getReactionsSummary($this->resource),
            'user_reaction' => $request->user()
                ? ArticleReaction::where('user_id', $request->user()->id)
                    ->where('news_article_id', $this->id)
                    ->value('reaction')
                : null,
        ];
    }

    private function resolveMediaUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        if (str_contains($url, '/storage/')) {
            $path = parse_url($url, PHP_URL_PATH);
            $resolved = url($path);
        } elseif (str_starts_with($url, '/')) {
            $resolved = url($url);
        } else {
            $resolved = $url;
        }

        if (request()->isSecure() && str_starts_with($resolved, 'http://')) {
            return 'https://'.substr($resolved, 7);
        }

        return $resolved;
    }
}
