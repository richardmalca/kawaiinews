<?php

namespace App\Models;

use App\Support\RemoteStorage;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $name
 * @property string|null $seo_title
 * @property string|null $description
 * @property string|null $contact_email
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
 * @property bool $auto_accept_news_enabled
 * @property int $auto_accept_news_daily_limit
 */
#[Fillable(['name', 'seo_title', 'description', 'contact_email', 'keywords', 'logo_path', 'favicon_path', 'favicon_192_path', 'apple_touch_icon_path', 'og_image_path', 'theme_color', 'twitter_handle', 'facebook_url', 'instagram_url', 'tiktok_url', 'search_box_enabled', 'auto_accept_news_enabled', 'auto_accept_news_daily_limit'])]
class SiteSetting extends Model
{
    private const CACHE_KEY = 'site-settings:singleton';

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'search_box_enabled' => 'boolean',
            'auto_accept_news_enabled' => 'boolean',
            'auto_accept_news_daily_limit' => 'integer',
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
            $model = self::query()->firstOrCreate(['id' => 1], ['name' => config('app.name', 'KawaiiNews')]);

            // firstOrCreate() no trae los defaults que aplica la base al
            // insertar (ej. search_box_enabled => false): el modelo en
            // memoria solo tiene los atributos que se pasaron explícitos.
            // fresh() vuelve a leer la fila ya insertada, con todo.
            return $model->wasRecentlyCreated ? $model->fresh()->getAttributes() : $model->getAttributes();
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

    /**
     * Nunca un dominio/email fijo: si no se cargó uno a mano, se arma con
     * el dominio real de la app (config('app.url'), lo que ya define
     * APP_URL) — así nunca queda desincronizado si el sitio cambia de
     * dominio.
     */
    public function contactEmail(): string
    {
        if ($this->contact_email) {
            return $this->contact_email;
        }

        $host = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

        return "legal@{$host}";
    }

    public function logoUrl(): ?string
    {
        return $this->resolveUrl($this->logo_path);
    }

    public function faviconUrl(): ?string
    {
        return $this->resolveUrl($this->favicon_path);
    }

    public function favicon192Url(): ?string
    {
        return $this->resolveUrl($this->favicon_192_path);
    }

    public function appleTouchIconUrl(): ?string
    {
        return $this->resolveUrl($this->apple_touch_icon_path);
    }

    public function ogImageUrl(): ?string
    {
        return $this->resolveUrl($this->og_image_path);
    }

    /**
     * El path guardado (ej. "site/logo.png") no dice por sí solo en qué
     * disco vive: pudo subirse con el almacenamiento externo activado o
     * no. Se prueba primero en el disco remoto (si está configurado y
     * activado para medios) y si no está ahí, se cae al local — mismo
     * criterio que MediaLibraryService::diskForUrl() para no romper
     * archivos subidos antes de cambiar la configuración.
     */
    private function resolveUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $storageSettings = StorageSetting::current();

        if ($storageSettings->active_for_media && $storageSettings->isConfigured()) {
            $remoteDisk = RemoteStorage::disk($storageSettings);

            if ($remoteDisk->exists($path)) {
                return $remoteDisk->url($path);
            }
        }

        return Storage::disk('public')->url($path);
    }
}
