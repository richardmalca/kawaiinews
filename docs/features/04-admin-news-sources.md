# Fuentes de noticias (`/admin/news-sources`)

Catálogo de sitios web usados como fuente para el scraping de noticias de anime, manga, geek, gaming, Japón/cultura y películas. Restringido al rol `superadmin`, igual que Modelo de IA.

## Acceso

- Rutas: `Route::resource('news-sources', ...)->only(['index','update','destroy'])`
- Toggle individual: `POST news-sources/{id}/toggle`
- Toggle masivo global: `POST news-sources/activate-all` / `POST news-sources/deactivate-all`
- Toggle masivo por categoría: `POST news-sources/category/{category}/activate` / `POST news-sources/category/{category}/deactivate` (`{category}` valida contra las claves de `config('news_sources_catalog')`, si no existe devuelve 404)
- Middleware: `auth`, `verified`, `role:superadmin`

## Arquitectura

A diferencia de Modelo de IA (donde el catálogo es solo referencia y hay que "agregar" cada proveedor), acá el seeder precarga **todas** las fuentes del catálogo directamente en la tabla `news_sources`, todas con `is_active = false`. La UI entonces no tiene flujo de "agregar desde catálogo": es directamente la lista completa agrupada por categoría, con un switch para activar/desactivar cada fuente.

- `config/news_sources_catalog.php` — catálogo estático agrupado por categoría (`anime`, `manga`, `geek`, `gaming`, `japon`, `peliculas`), cada fuente con `label`, `url` y `rss_url` opcional. A octubre 2026 tiene **30 fuentes**, con bastante peso en español (SomosKudasai, ANMTV, Ramen Para Dos, Vandal, 3DJuegos, HobbyConsolas, MeriStation, Xataka, Hipertextual, IGN en Español, Sensacine, Espinof, Cinemascomics) más medios de anime en inglés/portugués que suelen cubrir las mismas noticias desde otro ángulo (Anime News Network, MyAnimeList News, Anime Corner, AniTrendz, OtakuPT, ScreenRant, The Otaku's Study) — pensado para poder cruzar la misma noticia contada por distintos medios y redactar una nota propia combinando fuentes (ver [05-news-review-and-articles.md](05-news-review-and-articles.md)).
- Tabla `news_sources` — una fila por fuente del catálogo: `source_key` (única), `category`, `label`, `url`, `rss_url`, `is_active`, `last_scraped_at`.
- `database/seeders/NewsSourceSeeder.php` — recorre el catálogo y hace `firstOrCreate` por `source_key`, así que agregar una fuente nueva al config y volver a correr el seeder no duplica ni pisa las que ya están activadas.
- Algunas fuentes del catálogo quedan con `rss_url => null` a propósito (Crunchyroll News, Sensacine, NHK World, ScreenRant, The Otaku's Study) porque no tienen un feed RSS público confirmado — quedan igual en el catálogo como referencia informativa, pero el scraper (fase 5) las ignora (`whereNotNull('rss_url')`).

## Backend

| Capa | Archivo |
|---|---|
| Controlador | `app/Http/Controllers/Admin/NewsSourceController.php` |
| Servicio | `app/Services/NewsSourceService.php` |
| Modelo | `app/Models/NewsSource.php` |
| Form Request | `app/Http/Requests/Admin/UpdateNewsSourceRequest.php` |
| Resource | `app/Http/Resources/NewsSourceResource.php` |
| Seeder | `database/seeders/NewsSourceSeeder.php` |

`NewsSourceService::groupedByCategory()` arma la estructura que consume el frontend: cada categoría del config con sus fuentes de DB ya cargadas (ordenadas por label). `toggle()` invierte `is_active` de una fuente. `activateAll()`/`deactivateAll()` actualizan todas las filas de una sola vez (mass update por query builder — acá no hay problema porque `is_active` no tiene cast `encrypted`, a diferencia del gotcha de `AiProvider::api_key`). `activateCategory()`/`deactivateCategory()` hacen lo mismo pero filtrando por `category`. `summary()` da los KPIs (activas, total, categorías con al menos una activa).

## Frontend

```
resources/js/pages/admin/news-sources/
├── index.tsx                              resumen + acciones globales + cards por categoría
├── components/
│   ├── news-source-summary.tsx            KPIs (reutiliza AiProviderStat)
│   ├── news-source-bulk-actions.tsx       "Activar todas" / "Desactivar todas" (global)
│   ├── news-source-category-card.tsx      card por categoría: título + activar/desactivar de esa categoría + lista de fuentes
│   ├── news-source-row.tsx                fila: switch + link + RSS + editar/eliminar
│   ├── edit-news-source-dialog.tsx        modal para editar label/url/rss
│   └── delete-news-source-dialog.tsx      confirmación de borrado
└── hooks/
    ├── use-toggle-news-source.ts              toggle individual
    ├── use-bulk-toggle-news-sources.ts        activar/desactivar todas (global)
    ├── use-toggle-category-news-sources.ts    activar/desactivar todas (por categoría)
    ├── use-save-news-source.ts
    ├── use-delete-news-source.ts
    └── use-news-source-summary.ts
```

El componente `AiProviderStat` (de la feature de Modelo de IA) se reutiliza tal cual para los KPIs — es genérico (icon/label/value), no depende de nada específico de proveedores de IA.

Hay dos niveles de activación masiva: los botones de arriba de la página afectan las **30 fuentes**, y los botones dentro de cada card de categoría afectan solo esa categoría (ej. activar solo "Anime" sin tocar Gaming o Geek).

## Cómo agregar una fuente nueva al catálogo

1. Agregar la entrada en `config/news_sources_catalog.php` dentro de la categoría correspondiente (o crear una categoría nueva con su `label` y `sources`).
2. Correr `php artisan db:seed --class=NewsSourceSeeder` — crea solo las filas nuevas, no toca las existentes.
3. La fuente aparece inactiva en la UI; se activa con el switch o con los botones de "Activar todas".

## Notas

- `last_scraped_at` se setea automáticamente por `NewsScraperService::run()` (fase 5) cada vez que el scraper procesa esa fuente, sin importar si encontró noticias nuevas o no.
- Antes de correr el scraper desde `/admin/news-review`, esa página valida que exista al menos una fuente activa con `rss_url` — si no hay ninguna, muestra una alerta y bloquea el botón (ver [05-news-review-and-articles.md](05-news-review-and-articles.md)).
