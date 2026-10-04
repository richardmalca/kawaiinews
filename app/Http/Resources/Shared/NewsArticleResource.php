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
        $user = $this->resolvedUser($request);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'featured_image' => $this->resolveMediaUrl($this->featured_image),
            // Variante chica (~900px de ancho) para usar en listados/cards
            // en vez de la portada completa — ver ImageOptimizerService.
            // Cae a null en artículos viejos que no pasaron por la
            // reoptimización todavía; el frontend debe usar featured_image
            // como fallback en ese caso.
            'featured_image_card' => $this->resolveCardUrl($this->featured_image_card_url, $this->featured_image),
            'source_url' => $this->source_url,
            'status' => $this->status,
            'views_count' => $this->views_count,
            'published_at' => $this->published_at?->diffForHumans(),
            'published_at_formatted' => $this->published_at?->translatedFormat('d \d\e F, Y'),
            'published_at_time' => $this->published_at?->format('H:i'),
            'published_at_iso' => $this->published_at?->toIso8601String(),
            'updated_at_iso' => $this->updated_at?->toIso8601String(),
            'created_at' => $this->created_at?->diffForHumans(),
            // "url()" resuelve sobre APP_URL, que es el dominio del backend
            // (api.kawaiinews.net) — el canonical tiene que apuntar al
            // sitio público real que ve Google, no a la API.
            'canonical_url' => rtrim(config('services.kawaiinews_next.url'), '/')."/noticias/{$this->slug}",
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
            'has_liked' => $user ? $user->hasLiked($this->resource) : false,
            'has_favorited' => $user ? $user->hasFavorited($this->resource) : false,
            // Alias para el frontend Next.js (kawaiinews-nextjs), que espera
            // estos nombres puntuales en vez de likers_count/has_liked/etc.
            // El frontend Inertia sigue usando los campos de arriba tal
            // cual — esto solo agrega, no reemplaza nada.
            'likes_count' => (int) ($this->likers_count ?? $this->likers()->count()),
            'bookmarks_count' => (int) ($this->favorites_count ?? $this->favoriters()->count()),
            'is_liked' => $user ? $user->hasLiked($this->resource) : false,
            'is_bookmarked' => $user ? $user->hasFavorited($this->resource) : false,
            'reactions' => app(ArticleInteractionService::class)->getReactionsSummary($this->resource),
            'user_reaction' => $user
                ? ArticleReaction::where('user_id', $user->id)
                    ->where('news_article_id', $this->id)
                    ->value('reaction')
                : null,
            'references' => $this->whenLoaded('newsCluster', fn () => $this->newsCluster?->relationLoaded('scrapedItems')
                ? $this->newsCluster->scrapedItems
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'title' => $item->title,
                        'url' => $item->url,
                        'source_label' => $item->newsSource?->label ?? 'Fuente externa',
                    ])
                    ->values()
                : null),
        ];
    }

    /**
     * Las rutas públicas de listado/detalle (api.php: GET news/*) no llevan
     * middleware `auth:sanctum` a propósito — son públicas, no todo el
     * mundo tiene token. Pero eso significa que `$request->user()` (guard
     * por defecto, "web") nunca resuelve un token Bearer del frontend
     * Next.js, aunque venga uno válido: sin ese middleware nadie le pide al
     * guard "sanctum" que lo intente. Se resuelve el guard sanctum a mano
     * como fallback para no perder has_liked/has_favorited/etc. cuando un
     * usuario logueado en Next.js visita estas rutas sin sesión de cookie.
     */
    private function resolvedUser(Request $request)
    {
        return $request->user() ?? $request->user('sanctum');
    }

    private function resolveCardUrl(?string $cardUrl, ?string $featuredImage): ?string
    {
        if ($cardUrl) {
            return $this->resolveMediaUrl($cardUrl);
        }

        if (! $featuredImage) {
            return null;
        }

        return $this->resolveMediaUrl($featuredImage);
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
