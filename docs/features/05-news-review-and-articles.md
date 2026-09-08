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

- `reviewQueue(string $sort = 'relevance')` — clusters con `status` en `['pending', 'accepted']` (los `rejected` no se muestran nunca), con `scrapedItems.newsSource` y `article` cargados. `$sort` acepta `relevance` (default, por `relevance_score`), `newest` u `oldest` — estos dos últimos ordenan por la **fecha real de la noticia** (`NewsCluster::earliestPublishedAt()`, la fecha más antigua entre los `scraped_items` del cluster, no cuándo se scrapeó), para que el orden coincida con lo que se ve en la columna "Fecha" de la tabla. El orden se hace en memoria (`Collection::sortBy`) porque la fecha es un valor calculado desde una relación, no una columna. El selector vive en `NewsReviewSortSelect`, cambia la URL vía `router.get(..., {sort})`.
- `accept()` / `reject()` — cambian el `status`.
- `analyzeWithAi()` — analiza en lote los clusters `pending` sin veredicto todavía (`whereNull('ai_verdict')`, así no se re-analiza dos veces lo mismo). Arma un prompt con título/categoría/fuentes/antigüedad de cada uno y le pide al modelo un veredicto `PUBLICAR`/`DESCARTAR` + motivo corto por `ID`, parseado con regex (`ID:VEREDICTO:MOTIVO`). Se guarda en `news_clusters.ai_verdict` / `ai_reason` y se muestra como badge en la bandeja — **no descarta nada solo**, el usuario sigue decidiendo con Aceptar/Descartar.
  - **Por qué en lotes de 100 (`BATCH_SIZE`) y no todo en una sola llamada real:** con las ~220 noticias pendientes que puede acumular este proyecto, un solo prompt gigante superaba el timeout HTTP por defecto de Prism (30s) y no completaba. Se sube el timeout a 120s (`withClientOptions(['timeout' => 120])`) y se divide en tandas de 100 clusters — sigue siendo un puñado de llamadas (2-3) en vez de una por noticia, que era el objetivo real de "no quemar tokens".

### `app/Services/NewsArticleService.php`

- `createFromCluster()` — se llama al aceptar un cluster. Si hay un `AiProvider` activo con API key, arma un prompt con el título + resumen de cada fuente del cluster y le pide a Prism (mismo mecanismo que `AiProviderService::testConnection()`) que devuelva `TITULO:` / `RESUMEN:` / `CUERPO:` en un formato fijo, parseado con regex. Si no hay proveedor activo o falla la llamada, cae a un borrador mínimo (título y resumen del cluster, cuerpo vacío) — nunca bloquea la aceptación por un fallo de IA. El artículo se crea con `published_at` = la fecha real de la noticia (`NewsCluster::earliestPublishedAt()`), no la fecha en que se aceptó — así una noticia de hace un mes no aparece fechada como si fuera de hoy.
- `save()` — actualiza el artículo: recalcula el slug único (`Str::slug`) solo si el slug cambió, sincroniza tags (`firstOrCreate` por slug de tag). `published_at` se conserva siempre (ya no se pisa con `null` al guardar como borrador — antes de este ajuste, guardar un borrador borraba la fecha original precargada); solo se autocompleta con `now()` si estaba vacío y el estado pasa a `published`.

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

En pantallas chicas (debajo de `lg`) el sidebar no apila las 4 cards en una sola columna a ancho completo (se veían gigantes en mobile) — usa `grid grid-cols-2` para que Estado+Categoría y Etiquetas+Imagen destacada queden de a pares, y vuelve a una sola columna (`lg:grid-cols-1`) en desktop donde ya hay espacio de sobra al lado del contenido.

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
- **Generar con IA** — `source = 'ai'`. Usa `Prism::image()`, que a diferencia de `Prism::text()` **no lo soporta cualquier proveedor**: solo OpenAI (`dall-e-3`) y Gemini (`imagen-4`) generan imágenes. `MediaLibraryService::generateWithAi()` busca el primer `AiProvider` configurado con `provider` en `['openai', 'gemini']` (no necesariamente el "activo" para texto — Anthropic, el proveedor activo por defecto en este proyecto, no genera imágenes) y usa un modelo de imagen fijo por proveedor (no el `default_model` del proveedor, que es un modelo de texto). Si no hay ninguno configurado, lanza un error claro en vez de fallar silenciosamente: "No hay un proveedor con soporte de imágenes configurado (OpenAI o Gemini)."
  - **No hay campo de texto libre para el prompt.** El botón "Generar con IA a partir de la noticia" arma el prompt automáticamente en `edit.tsx` a partir de `title` + `excerpt` + el `body` sin tags HTML (`aiImagePrompt`), y solo se habilita cuando los tres campos están completos (`isContentComplete`) — así la imagen generada siempre corresponde al contenido real de la noticia, no a lo que el usuario tipeó aparte. Si falta algo, el botón queda deshabilitado con un `title` explicando qué falta.
- Al borrar (`delete()`), si la URL apunta al disco `public` local (subida o generada con IA en base64) también borra el archivo físico; si es una URL externa (agregada por URL, o generada por un proveedor que devuelve URL en vez de base64) solo borra el registro.

`app/Services/MediaLibraryService.php` centraliza `list()`, `storeUpload()`, `storeFromUrl()`, `delete()` (borra también el archivo físico si `source === 'upload'`).

El frontend (`use-media-library.ts`) no usa `useHttp` para estas llamadas — como el modal necesita listar (`GET`), subir un archivo (`multipart/form-data`) y agregar por URL (`JSON`) con datos que cambian en cada llamada, se usa `fetch()` directo leyendo el token CSRF de la cookie `XSRF-TOKEN` (`X-XSRF-TOKEN` header, el mismo mecanismo que usa axios/el cliente XHR interno de Inertia).

## Frontend

```
resources/js/pages/admin/news-review/
├── index.tsx                       tabla compacta + selector de orden + Analizar con IA + alerta si no hay fuentes activas
├── components/
│   ├── run-scraper-button.tsx      dispara el scraping (useHttp, como "Probar conexión"), soporta `disabled`
│   ├── analyze-with-ai-button.tsx  dispara el análisis en lote
│   ├── news-review-sort-select.tsx cambia ?sort= vía router.get
│   └── news-cluster-row.tsx        fila de tabla: tema + fuentes + badge IA/estado + Aceptar/Descartar, o "Ya en la página" + Editar si ya fue aceptado
└── hooks/
    ├── use-run-scraper.ts          lanza error si sources_scraped === 0 (sin fuentes activas)
    ├── use-analyze-with-ai.ts      lanza error si viene `error` en la respuesta
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
