# Fuentes de noticias (`/admin/news-sources`)

Catálogo de sitios web usados como fuente para el scraping de noticias de anime, manga, geek, gaming, Japón/cultura y películas. Restringido al rol `superadmin`, igual que Modelo de IA.

## Acceso

- Rutas: `Route::resource('news-sources', ...)->only(['index','update','destroy'])` + `POST news-sources/{id}/toggle`
- Middleware: `auth`, `verified`, `role:superadmin`

## Arquitectura

A diferencia de Modelo de IA (donde el catálogo es solo referencia y hay que "agregar" cada proveedor), acá el seeder precarga **todas** las fuentes del catálogo directamente en la tabla `news_sources`, todas con `is_active = false`. La UI entonces no tiene flujo de "agregar desde catálogo": es directamente la lista completa agrupada por categoría, con un switch para activar/desactivar cada fuente.

- `config/news_sources_catalog.php` — catálogo estático agrupado por categoría (`anime`, `manga`, `geek`, `gaming`, `japon`, `peliculas`), cada fuente con `label`, `url` y `rss_url` opcional.
- Tabla `news_sources` — una fila por fuente del catálogo: `source_key` (única), `category`, `label`, `url`, `rss_url`, `is_active`, `last_scraped_at` (para cuando se implemente el scraping real).
- `database/seeders/NewsSourceSeeder.php` — recorre el catálogo y hace `firstOrCreate` por `source_key`, así que agregar una fuente nueva al config y volver a correr el seeder no duplica ni pisa las que ya están activadas.

## Backend

| Capa | Archivo |
|---|---|
| Controlador | `app/Http/Controllers/Admin/NewsSourceController.php` |
| Servicio | `app/Services/NewsSourceService.php` |
| Modelo | `app/Models/NewsSource.php` |
| Form Request | `app/Http/Requests/Admin/UpdateNewsSourceRequest.php` |
| Resource | `app/Http/Resources/NewsSourceResource.php` |
| Seeder | `database/seeders/NewsSourceSeeder.php` |

`NewsSourceService::groupedByCategory()` arma la estructura que consume el frontend: cada categoría del config con sus fuentes de DB ya cargadas (ordenadas por label). `toggle()` invierte `is_active`. `summary()` da los KPIs (activas, total, categorías con al menos una activa).

## Frontend

```
resources/js/pages/admin/news-sources/
├── index.tsx                              resumen + cards por categoría
├── components/
│   ├── news-source-summary.tsx            KPIs (reutiliza AiProviderStat)
│   ├── news-source-category-card.tsx      card por categoría, lista de fuentes
│   ├── news-source-row.tsx                fila: switch + link + RSS + editar/eliminar
│   ├── edit-news-source-dialog.tsx        modal para editar label/url/rss
│   └── delete-news-source-dialog.tsx      confirmación de borrado
└── hooks/
    ├── use-toggle-news-source.ts
    ├── use-save-news-source.ts
    ├── use-delete-news-source.ts
    └── use-news-source-summary.ts
```

El componente `AiProviderStat` (de la feature de Modelo de IA) se reutiliza tal cual para los KPIs — es genérico (icon/label/value), no depende de nada específico de proveedores de IA.

## Cómo agregar una fuente nueva al catálogo

1. Agregar la entrada en `config/news_sources_catalog.php` dentro de la categoría correspondiente (o crear una categoría nueva con su `label` y `sources`).
2. Correr `php artisan db:seed --class=NewsSourceSeeder` — crea solo las filas nuevas, no toca las existentes.
3. La fuente aparece inactiva en la UI; se activa con el switch.

## Notas

- El scraping real (leer el RSS o hacer scraping del HTML de cada fuente activa) todavía no está implementado — esta fase solo deja la infraestructura de catálogo + activación lista para que un job/comando posterior itere `NewsSource::where('is_active', true)`.
- `last_scraped_at` ya existe en el modelo y el resource (formateado con `diffForHumans()`), pendiente de setear cuando se implemente el scraper.
