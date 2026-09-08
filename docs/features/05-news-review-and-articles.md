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
3. La relevancia se recalcula en cada asignación: `(cantidad_de_fuentes_distintas * 10) + bono_de_recencia`, donde más fuentes distintas cubriendo el mismo tema es el factor dominante (es el caso de uso real: una noticia contada por 3 fuentes pesa más que una sola fuente).

La comparación de clusters candidatos **no filtra por status** — un tema ya rechazado sigue absorbiendo noticias similares (así no reaparece en la bandeja como si fuera nuevo).

**Nota de idioma:** el título/resumen del cluster se guarda tal cual viene de la fuente original (inglés, portugués, español, según la fuente) — no se traduce en esta etapa a propósito, para no gastar una llamada a la IA por cada tema nuevo encontrado en cada corrida del scraper. La traducción ocurre recién en la Etapa B, al aceptar.

Disparo: botón manual "Buscar noticias ahora" en `/admin/news-review` (decisión explícita para v1, no hay cron todavía). El botón valida que haya al menos una fuente activa con `rss_url` antes de habilitarse — si no hay ninguna, la página muestra una alerta (`Alert` destructiva) con link directo a Fuentes de noticias y el botón queda deshabilitado; el endpoint `POST news-review/scrape` también valida esto server-side (devuelve `sources_scraped: 0` y un mensaje en `errors`, sin correr el scraper).

## Etapa B — Bandeja de revisión → CMS

### `app/Services/NewsClusterService.php`

- `reviewQueue()` — clusters con `status` en `['pending', 'accepted']` (los `rejected` no se muestran nunca), con `scrapedItems.newsSource` y `article` cargados, ordenados por `relevance_score` descendente. Los `accepted` se siguen mostrando para que la bandeja funcione como historial visual — ver más abajo.
- `accept()` / `reject()` — cambian el `status`.

### `app/Services/NewsArticleService.php`

- `createFromCluster()` — se llama al aceptar un cluster. Si hay un `AiProvider` activo con API key, arma un prompt con el título + resumen de cada fuente del cluster y le pide a Prism (mismo mecanismo que `AiProviderService::testConnection()`) que devuelva `TITULO:` / `RESUMEN:` / `CUERPO:` en un formato fijo, parseado con regex. Si no hay proveedor activo o falla la llamada, cae a un borrador mínimo (título y resumen del cluster, cuerpo vacío) — nunca bloquea la aceptación por un fallo de IA.
- `save()` — actualiza el artículo: recalcula el slug único (`Str::slug`) solo si el slug cambió, sincroniza tags (`firstOrCreate` por slug de tag), y si el estado pasa a `published` setea `published_at` la primera vez.

### El prompt de generación (traducción + redacción + formato)

El prompt le pide explícitamente al modelo:

- **Traducir y redactar en español** (sin importar el idioma original de las fuentes del cluster).
- Un **título distinto del resumen** — no una repetición, sino un titular de prensa más atractivo (evita el problema de "la noticia sale igual que la descripción").
- **Formato enriquecido en el cuerpo**, con una sintaxis mixta markdown/HTML fija:
  - `**negrita**` para nombres propios y datos clave
  - `*cursiva*` para citas textuales o énfasis
  - `<u>subrayado</u>` para el dato más importante de la noticia

`parseDraft()` extrae `TITULO:` / `RESUMEN:` / `CUERPO:` con regex de la respuesta del modelo.

### Tablas

- `news_articles` — `news_cluster_id` (nullable, referencia de origen), `title`, `slug` (único), `category`, `excerpt`, `body`, `featured_image` (URL, no upload de archivo en v1), `status` (`draft`/`published`), `published_at`.
- `tags` + `news_article_tag` (pivote) — tags reutilizables entre artículos.

## Frontend

```
resources/js/pages/admin/news-review/
├── index.tsx                       bandeja ordenada por relevancia + alerta si no hay fuentes activas
├── components/
│   ├── run-scraper-button.tsx      dispara el scraping (useHttp, como "Probar conexión"), soporta `disabled`
│   └── news-cluster-card.tsx       tema + fuentes + Aceptar/Descartar, o badge "Ya en la página" + Editar si ya fue aceptado
└── hooks/
    ├── use-run-scraper.ts          lanza error si sources_scraped === 0 (sin fuentes activas)
    ├── use-accept-news-cluster.ts
    └── use-reject-news-cluster.ts

resources/js/pages/admin/news-articles/
├── index.tsx                       listado (tabla) de artículos
├── edit.tsx                        formulario completo tipo CMS
├── components/
│   ├── news-articles-table.tsx
│   ├── news-article-status-badge.tsx
│   ├── news-article-tags-input.tsx     tags con datalist + badges removibles
│   ├── article-body-editor.tsx         Textarea + toolbar (negrita/cursiva/subrayado)
│   └── delete-news-article-dialog.tsx
└── hooks/
    ├── use-article-slug.ts             slug autogenerado del título, editable a mano
    ├── use-text-formatting.ts          envuelve la selección del textarea con **/*/<u>
    ├── use-save-news-article.ts
    └── use-delete-news-article.ts
```

`use-article-slug.ts` genera el slug a partir del título mientras el campo slug no fue tocado a mano (`slugTouched`); en cuanto el usuario lo edita directamente, deja de autogenerarse — mismo patrón "personalizable pero automática" pedido para el título.

`use-text-formatting.ts` usa un `ref` al `<textarea>` para leer `selectionStart`/`selectionEnd` y envolver el texto seleccionado con el marcador correspondiente (si no hay nada seleccionado, inserta la palabra "texto" ya envuelta, como placeholder editable). El componente `ArticleBodyEditor` mantiene el body como estado controlado (no `defaultValue`) para que la toolbar pueda mutar el valor.

### "Ya en la página" — marca de noticias ya aceptadas

La bandeja de revisión no oculta los temas ya aceptados: `NewsClusterResource` expone `status` y `article_id` (vía la relación `NewsCluster::article()`, `hasOne(NewsArticle)`), y `NewsClusterCard` en el frontend muestra:

- Borde destacado (`ring-2 ring-primary`) y badge **"Ya en la página"** cuando `status === 'accepted'`.
- Un botón **"Editar noticia"** (en vez de Aceptar/Descartar) que lleva directo a `/admin/news-articles/{id}/edit`.

Así el usuario puede ver de un vistazo, revisando la bandeja, qué temas ya se convirtieron en artículo sin tener que cruzar contra el listado de `/admin/news-articles`.

El sidebar tiene un grupo **"Contenido"** (Revisar noticias, Noticias), separado de "Servicios externos" (que es configuración de integraciones, no curación de contenido).

## Verificado en vivo

Con Anime News Network, MyAnimeList, Anime Corner y OtakuPT activas se encontró la noticia real "Re:Zero confirma diez años más de historia" (cubierta también en la web por SomosKudasai, Anime Corner, AniTrendz, ScreenRant y The Otaku's Study — ver [04-admin-news-sources.md](04-admin-news-sources.md)). Al aceptarla, el proveedor de IA activo (Anthropic) generó automáticamente:

- Título: *"Subaru Natsuki no descansará: Re:Zero tiene cuerda para diez años más"* (distinto del resumen)
- Resumen y cuerpo en español, con `**negrita**`, `*cursiva*` y `<u>subrayado</u>` aplicados correctamente
- El cluster quedó marcado "Ya en la página" en la bandeja, con link directo al borrador

Flujo completo confirmado: **scraping → cluster con relevancia → aceptar → traducción y redacción con formato → borrador editable → marca visible en la bandeja → guardar con tags**.

## Pendiente (no en esta fase)

- Publicación real (sitio público) — por ahora "publicado" es solo un estado administrable, como pidió el usuario.
- Disparo programado del scraper (cron) — quedó manual a propósito para v1.
- Subida de imagen destacada como archivo — por ahora es una URL editable (se prellena con la imagen del cluster si el RSS trae una).
- Traducir el título/resumen del cluster ya en la etapa de scraping (para que la bandeja se vea en español antes de aceptar) — evaluado y descartado por ahora: implicaría una llamada a la IA por cada tema nuevo encontrado en cada corrida del scraper, no solo al aceptar.
