<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $name
 * @property string|null $seo_title
 * @property string|null $description
 * @property array<int, string>|null $keywords
 * @property string|null $logo_path
 * @property string|null $favicon_path
 * @property string|null $favicon_192_path
 * @property string|null $apple_touch_icon_path
 * @property string|null $og_image_path
 * @property string|null $theme_color
 * @property string|null $twitter_handle
 * @property string|null $facebook_url
 * @property string|null $instagram_url
 * @property string|null $tiktok_url
 * @property bool $search_box_enabled
 */
#[Fillable(['name', 'seo_title', 'description', 'keywords', 'logo_path', 'favicon_path', 'favicon_192_path', 'apple_touch_icon_path', 'og_image_path', 'theme_color', 'twitter_handle', 'facebook_url', 'instagram_url', 'tiktok_url', 'search_box_enabled'])]
class SiteSetting extends Model
{
    private const CACHE_KEY = 'site-settings:singleton';

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'search_box_enabled' => 'boolean',
        ];
    }

    /**
     * Única fila de configuración del sitio, cacheada indefinidamente
     * (se invalida sola en save()) — se lee en cada visita pública para
     * las meta tags, así que evitamos pegarle a la base todo el tiempo.
     *
     * Cachea solo el array de atributos, no la instancia del modelo: cachear
     * un Eloquent model serializado puede volver como __PHP_Incomplete_Class
     * si se deserializa en un contexto donde la clase todavía no cargó
     * (workers, comandos artisan) — con el array reconstruimos el modelo
     * nosotros, sin depender de que unserialize() resuelva bien la clase.
     */
    public static function current(): self
    {
        $attributes = Cache::rememberForever(self::CACHE_KEY, function () {
            return self::query()
                ->firstOrCreate(['id' => 1], ['name' => config('app.name', 'KawaiiNews')])
                ->getAttributes();
        });

        $model = new self;
        $model->setRawAttributes($attributes, true);
        $model->exists = true;

        return $model;
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    /**
     * El título completo para SEO (home, páginas sin título propio). Si
     * todavía no se cargó uno, cae al nombre corto para no dejar el
     * <title> vacío.
     */
    public function seoTitle(): string
    {
        return $this->seo_title ?: $this->name;
    }

    /**
     * URLs de redes sociales completas (no solo el handle de X), para el
     * `sameAs` del JSON-LD de Organization — así Google puede relacionar el
     * sitio con sus perfiles oficiales.
     *
     * @return array<int, string>
     */
    public function socialLinks(): array
    {
        return array_values(array_filter([
            $this->twitter_handle ? 'https://x.com/'.ltrim($this->twitter_handle, '@') : null,
            $this->facebook_url,
            $this->instagram_url,
            $this->tiktok_url,
        ]));
    }

    public function logoUrl(): ?string
    {
        return $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null;
    }

    public function faviconUrl(): ?string
    {
        return $this->favicon_path ? Storage::disk('public')->url($this->favicon_path) : null;
    }

    public function favicon192Url(): ?string
    {
        return $this->favicon_192_path ? Storage::disk('public')->url($this->favicon_192_path) : null;
    }

    public function appleTouchIconUrl(): ?string
    {
        return $this->apple_touch_icon_path ? Storage::disk('public')->url($this->apple_touch_icon_path) : null;
    }

    public function ogImageUrl(): ?string
    {
        return $this->og_image_path ? Storage::disk('public')->url($this->og_image_path) : null;
    }
}
