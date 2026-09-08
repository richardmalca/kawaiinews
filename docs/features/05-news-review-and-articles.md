# Revisar noticias y CMS de artículos (`/admin/news-review`, `/admin/news-articles`)

Toma las fuentes activas de la fase 4 y las convierte en un flujo de dos etapas: primero una **bandeja de revisión** que agrupa noticias similares de varias fuentes y les da un puntaje de relevancia, y después un **CMS simple** donde el tema aceptado se convierte en un artículo editable (borrador → publicado). Restringido al rol `superadmin`.

## Por qué dos etapas

Scrapear y publicar directo generaría ruido: la misma noticia repetida por cada fuente, y notas irrelevantes mezcladas con las importantes. Separar en "candidatos agrupados con relevancia" (`NewsCluster`) y "artículo publicable" (`NewsArticle`) permite curar antes de escribir, y que rechazar un tema quede memorizado (no vuelve a aparecer como si fuera nuevo).

## Etapa A — Scraping y clustering

### Modelos y tablas

- `scraped_items` — una fila por noticia cruda leída del RSS de una fuente: `news_source_id`, `title`, `url` (única), `summary`, `image_url`, `published_at`, `news_cluster_id` (a qué tema quedó asignada).
- `news_clusters` — un tema agrupado: `title`, `category`, `summary`, `image_url`, `sources_count` (cuántas fuentes distintas lo cubrieron), `relevance_score`, `status` (`pending` / `accepted` / `rejected`), `first_seen_at`, `last_seen_at`.

### `app/Services/NewsScraperService.php`

`run()` recorre `NewsSource::where('is_active', true)->whereNotNull('rss_url')`, descarga cada feed con `Http::get()` y lo parsea con `SimpleXMLElement` (RSS estándar: `channel > item`, con fallback a `enclosure`/`media:content` para la imagen). Por cada item nuevo (dedupe por `url` única):

1. Se crea el `ScrapedItem`.
2. `assignToCluster()` normaliza el título (minúsculas, sin acentos, sin stopwords ES/EN) y lo compara por **similitud de Jaccard** (intersección de palabras / unión de palabras) contra los clusters de la misma categoría vistos en los últimos 4 días (`CLUSTER_WINDOW_DAYS`). Si supera el umbral (`SIMILARITY_THRESHOLD = 0.35`), se suma a ese cluster; si no, crea uno nuevo con `status = pending`.
3. La relevancia se recalcula en cada asignación: `(cantidad_de_fuentes_distintas * 10) + bono_de_recencia`, donda más fuentes distintas cubriendo el mismo tema es el factor dominante (es el caso de uso real: una noticia contada por 3 fuentes pesa más que una sola fuente).

La comparación de clusters candidatos **no filtra por status** — un tema ya rechazado sigue absorbiendo noticias similares (así no reaparece en la bandeja como si fuera nuevo), pero un cluster `accepted` o `rejected` nunca vuelve a mostrarse en la cola porque esa solo lista `pending`.

Disparo: botón manual "Buscar noticias ahora" en la UI (decisión explícita del usuario para v1, no cron todavía).

## Etapa B — Bandeja de revisión → CMS

### `app/Services/NewsClusterService.php`

- `reviewQueue()` — clusters `pending` con sus `scrapedItems.newsSource` cargados, ordenados por `relevance_score` descendente.
- `accept()` / `reject()` — cambian el `status`.

### `app/Services/NewsArticleService.php`

- `createFromCluster()` — se llama al aceptar un cluster. Si hay un `AiProvider` activo con API key, arma un prompt con el título + resumen de cada fuente del cluster y le pide a Prism (mismo mecanismo que `AiProviderService::testConnection()`) que devuelva `TITULO:` / `RESUMEN:` / `CUERPO:` en un formato fijo, parseado con regex. Si no hay proveedor activo o falla la llamada, cae a un borrador mínimo (título y resumen del cluster, cuerpo vacío) — nunca bloquea la aceptación por un fallo de IA.
- `save()` — actualiza el artículo: recalcula el slug único (`Str::slug`) solo si el slug cambió, sincroniza tags (`firstOrCreate` por slug de tag), y si el estado pasa a `published` setea `published_at` la primera vez.

### Tablas

- `news_articles` — `news_cluster_id` (nullable, referencia de origen), `title`, `slug` (único), `category`, `excerpt`, `body`, `featured_image` (URL, no upload de archivo en v1), `status` (`draft`/`published`), `published_at`.
- `tags` + `news_article_tag` (pivote) — tags reutilizables entre artículos.

## Frontend

```
resources/js/pages/admin/news-review/
├── index.tsx                       bandeja ordenada por relevancia
├── components/
│   ├── run-scraper-button.tsx      dispara el scraping (useHttp, como "Probar conexión")
│   └── news-cluster-card.tsx       tema + fuentes + Aceptar/Descartar
└── hooks/
    ├── use-run-scraper.ts
    ├── use-accept-news-cluster.ts
    └── use-reject-news-cluster.ts

resources/js/pages/admin/news-articles/
├── index.tsx                       listado (tabla) de artículos
├── edit.tsx                        formulario completo tipo CMS
├── components/
│   ├── news-articles-table.tsx
│   ├── news-article-status-badge.tsx
│   ├── news-article-tags-input.tsx     tags con datalist + badges removibles
│   └── delete-news-article-dialog.tsx
└── hooks/
    ├── use-article-slug.ts             slug autogenerado del título, editable a mano
    ├── use-save-news-article.ts
    └── use-delete-news-article.ts
```

`use-article-slug.ts` genera el slug a partir del título mientras el campo slug no fue tocado a mano (`slugTouched`); en cuanto el usuario lo edita directamente, deja de autogenerarse — mismo patrón que "personalizable pero automática" pedido para el título.

El sidebar tiene un grupo nuevo **"Contenido"** (Revisar noticias, Noticias), separado de "Servicios externos" (que es configuración de integraciones, no curación de contenido).

## Verificado en vivo

Con Anime News Network activa se scrapearon 180 noticias reales, se agruparon en 166 clusters, se aceptó una y el proveedor de IA activo (Anthropic) generó automáticamente título, resumen y cuerpo en español a partir del resumen en inglés de la fuente — confirmando el flujo completo: **scraping → cluster con relevancia → aceptar → borrador editable → guardar con tags**.

## Pendiente (no en esta fase)

- Publicación real (sitio público) — por ahora "publicado" es solo un estado administrable, como pidió el usuario.
- Disparo programado del scraper (cron) — quedó manual a propósito para v1.
- Subida de imagen destacada como archivo — por ahora es una URL editable (se prellena con la imagen del cluster si el RSS trae una).
