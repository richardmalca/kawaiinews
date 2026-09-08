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
- **HTML directo en el cuerpo** (no markdown): `<p>` por párrafo, `<strong>` para nombres propios y datos clave, `<em>` para citas o énfasis, `<u>` para el dato más importante, `<h3>` si hace falta un subtítulo — así carga sin conversión en el editor de bloques (ver más abajo).

`parseDraft()` extrae `TITULO:` / `RESUMEN:` / `CUERPO:` con regex de la respuesta del modelo.

### Tablas

- `news_articles` — `news_cluster_id` (nullable, referencia de origen), `title`, `slug` (único), `category`, `excerpt`, `body` (HTML), `featured_image` (URL — apunta a un archivo subido o a una URL externa registrada en la biblioteca de medios), `status` (`draft`/`published`), `published_at`.
- `tags` + `news_article_tag` (pivote) — tags reutilizables entre artículos.
- `media` — biblioteca de imágenes: `url`, `original_name`, `source` (`upload` los subidos como archivo al disco `public`, `url` los agregados pegando un link externo sin volver a alojarlos).

## Editor tipo CMS (`edit.tsx`)

Layout de dos columnas estilo WordPress: contenido principal a la izquierda (título grande, permalink editable, resumen, editor de bloques) y un sidebar a la derecha con una card por control de publicación (Estado, Categoría, Etiquetas, Imagen destacada). El botón "Guardar" vive en el header de la página, no hay que scrollear para encontrarlo.

- **Título** — `<input>` grande sin borde de caja (estilo H1), no un `Input` de formulario genérico.
- **Slug** — `ArticlePermalinkField`: se muestra como texto `/noticias/{slug}` (como el permalink de WordPress), con un botón "Editar" que lo convierte en un campo editable al click; se autogenera del título mientras no se toque a mano (`useArticleSlug`).
- **Estado** — `ArticleStatusToggle`: `ToggleGroup` de 2 opciones (Borrador/Publicada) en vez de un `<select>`, porque con solo 2 valores un desplegable es fricción de más.
- **Categoría** — `ArticleCategoryPicker`: `ToggleGroup` de una sola selección con una pastilla por categoría del catálogo (`news_sources_catalog`), en vez de un `<select>`. Sigue siendo una categoría por noticia (columna `category` sin cambios); múltiples categorías por noticia se evaluó y se decidió no hacerlo por ahora — implicaría migrar a una relación muchos-a-muchos como tags.
- **Contenido** — `RichTextEditor`, ver abajo.
- **Imagen destacada** — abre `MediaLibraryDialog` en vez de pedir una URL a mano.

### Editor de bloques: BlockNote

`RichTextEditor` usa [BlockNote](https://www.blocknotejs.org/) (`@blocknote/core` + `@blocknote/react` + `@blocknote/mantine`) en vez de una toolbar armada a mano — es un editor de bloques completo ya hecho (como Notion): títulos, negrita/cursiva/subrayado/tachado, listas, checklist, citas, código, imágenes por URL o arrastrando el archivo, menú "/" para insertar cualquier bloque, toolbar flotante al seleccionar texto.

El contenido se guarda como `body` (HTML) en la DB, no como el formato de bloques propio de BlockNote:

- Al cargar: `editor.tryParseHTMLToBlocks(value)` convierte el HTML guardado a bloques.
- Al cambiar: `editor.blocksToFullHTML(editor.document)` vuelve a serializar a HTML antes de llamar `onChange`.

Esto mantiene compatibilidad con el HTML que ya genera `NewsArticleService` al aceptar un cluster — no hay que tocar el backend para que el contenido generado por IA se vea bien en el editor.

**Se descartó @tiptap/react como toolbar manual** (versión anterior de este editor): armar botón por botón (negrita, cursiva, H2, H3...) es mucho más trabajo que usar BlockNote, que ya trae todo eso resuelto con mejor UX (menú "/", drag & drop de imágenes, toolbar flotante).

## Biblioteca de medios (`/admin/media`)

Modal (`MediaLibraryDialog`) reutilizable para elegir la imagen destacada de una noticia:

- Grid de imágenes ya guardadas (`Media::orderByDesc('id')`), click para seleccionar y cerrar el modal.
- **Subir archivo** — sube al disco `public` (`Storage::disk('public')`, requiere `php artisan storage:link`), crea un registro `Media` con `source = 'upload'`.
- **Agregar por URL** — no descarga el archivo, solo registra la URL externa como `source = 'url'` para que quede en la biblioteca y sea reutilizable en otras noticias.

`app/Services/MediaLibraryService.php` centraliza `list()`, `storeUpload()`, `storeFromUrl()`, `delete()` (borra también el archivo físico si `source === 'upload'`).

El frontend (`use-media-library.ts`) no usa `useHttp` para estas llamadas — como el modal necesita listar (`GET`), subir un archivo (`multipart/form-data`) y agregar por URL (`JSON`) con datos que cambian en cada llamada, se usa `fetch()` directo leyendo el token CSRF de la cookie `XSRF-TOKEN` (`X-XSRF-TOKEN` header, el mismo mecanismo que usa axios/el cliente XHR interno de Inertia).

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
├── edit.tsx                        editor tipo CMS: dos columnas, sidebar de publicación
├── components/
│   ├── news-articles-table.tsx
│   ├── news-article-status-badge.tsx
│   ├── news-article-tags-input.tsx     tags con datalist + badges removibles
│   ├── article-permalink-field.tsx     slug mostrado como permalink, editable al click
│   ├── article-status-toggle.tsx       ToggleGroup de 2 opciones (borrador/publicada)
│   ├── article-category-picker.tsx     ToggleGroup de pastillas, una categoría
│   ├── rich-text-editor.tsx            wrapper de BlockNote (HTML <-> bloques)
│   ├── media-library-dialog.tsx        modal: grid + subir archivo + agregar por URL
│   └── delete-news-article-dialog.tsx
└── hooks/
    ├── use-article-slug.ts             slug autogenerado del título, editable a mano
    ├── use-media-library.ts            list/upload/addFromUrl vía fetch + XSRF-TOKEN
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
