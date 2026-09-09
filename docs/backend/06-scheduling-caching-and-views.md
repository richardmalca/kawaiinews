# Scheduler, colas, caché, vistas y sitemap/feed

Con el sitio público ya funcionando ([docs/frontend/](../frontend/)), esta fase agrega lo que un sitio con tráfico real necesita y que no venía cubierto: que el scraper corra solo, que las operaciones largas no cuelguen el navegador del admin, que las consultas públicas no le peguen a la base en cada visita, un contador de vistas que no la sature, y SEO básico (sitemap + RSS).

## Scheduler (`routes/console.php`)

Laravel 12 agenda tareas directamente en `routes/console.php` con la fachada `Schedule` (no hay `app/Console/Kernel.php` en esta versión):

```php
Schedule::command('news:scrape')->everyThirtyMinutes()->withoutOverlapping()->onOneServer();
Schedule::command('news:auto-review')->cron('5,35 * * * *')->withoutOverlapping()->onOneServer();
Schedule::command('views:flush')->everyMinute()->withoutOverlapping()->onOneServer();
```

- `news:scrape` (`ScrapeNewsCommand`) — corre `NewsScraperService::run()` directo (sin pasar por cola: un comando de consola no tiene el límite de tiempo de un request HTTP, así que no hace falta). Antes el scraping era 100% manual vía el botón "Buscar noticias ahora"; ahora corre solo cada 30 minutos además de poder dispararse a mano.
- `news:auto-review` (`AutoReviewNewsCommand`) — analiza con IA (`NewsClusterService::analyzeWithAi()`) todo cluster `pending` sin veredicto todavía, y **rechaza automáticamente** (`status = rejected`) los que la IA marcó `discard` (`NewsClusterService::autoRejectDiscarded()`). Los marcados `publish` **no** se tocan solos — siguen esperando que alguien los acepte a mano desde `/admin/news-review` (o el botón "Aceptar todo lo marcado Publicar"), a propósito: la IA filtra el ruido, pero la decisión de qué se convierte en noticia real la sigue tomando una persona. Corre 5 minutos después de cada scrape (`5,35 * * * *` en vez de `everyThirtyMinutes()`), para darle tiempo a terminar de agrupar los clusters nuevos antes de analizarlos. Si no hay proveedor de IA activo con API key, no rompe nada — `analyzeWithAi()` ya devolvía ese caso como `analyzed: 0` con un mensaje de error, y el comando lo loguea como warning y sigue.
  - **Corre cada 30 minutos indefinidamente y le pega a un proveedor de IA real** — implica un costo recurrente, no es gratis dejarlo prendido. No tiene el rate limit `ai-costly` (ver [04-admin-news-sources.md](04-admin-news-sources.md)) porque ese limitador es por usuario HTTP y esto corre por cron, sin sesión.
- `views:flush` (`FlushArticleViews`) — vuelca a la base los contadores de vistas acumulados en caché (ver más abajo), cada minuto.
- `withoutOverlapping()` evita que una corrida larga se solape con la siguiente si el scraper tarda más de 30 minutos. `onOneServer()` usa un lock atómico (soportado por el driver de caché `database` que usa este proyecto) para que, si en producción hay más de un servidor corriendo el scheduler, la tarea no se dispare duplicada.

**Importante:** el scheduler necesita algo que llame a `php artisan schedule:run` cada minuto — en producción, una entrada de cron real (`* * * * * php artisan schedule:run`) o el scheduler administrado de Laravel Cloud; en desarrollo local, `php artisan schedule:work` (no está incluido en `composer run dev`, hay que correrlo aparte si se quiere probar el cron localmente).

## Operaciones largas van a una cola, no al request HTTP

`NewsReviewController::scrape()`, `analyze()` y `applyAiVerdicts()` despachan jobs (`ScrapeNewsSourcesJob`, `AnalyzeNewsClustersJob`, `ApplyAiVerdictsJob`, los tres `ShouldQueue`) en vez de ejecutar el trabajo real durante el request. El patrón es el mismo para los tres:

1. El controller genera un `run_id` con `App\Support\JobRunStatus::start()` (queda en caché con estado `queued`), despacha el job pasándole ese `run_id`, y responde enseguida `{run_id}`.
2. El job hace el trabajo real (llama al service correspondiente) y guarda el resultado — o el mensaje de error si algo falla — en la misma entrada de caché (`JobRunStatus::complete()` / `fail()`, TTL 15 minutos).
3. El frontend admin hace polling a `GET admin/news-review/runs/{runId}` cada 1.5s (`use-job-run.ts` → `waitForJobRun<T>()`) hasta que el estado deja de ser `queued`, y recién ahí resuelve la promesa que alimenta el `toast.promise` de cada botón.

Esto reemplaza el enfoque anterior, donde el análisis en lote con IA subía el timeout de Prism a 120s y aun así el usuario se quedaba esperando con el botón cargando varios minutos. Requiere un worker de colas corriendo (`php artisan queue:work` en producción; en dev, `php artisan dev` ya levanta `queue:listen`, así que funciona sin configuración extra).

`App\Support\JobRunStatus` es genérico (no sabe nada de scraping ni de IA) — cualquier operación futura que necesite este mismo patrón "encolar + pollear estado" lo puede reusar.

## Aplicar veredictos de IA en lote

`NewsClusterService::acceptAllPublishVerdicts()` acepta y convierte en artículo todos los clusters `pending` marcados `ai_verdict = publish`, de una sola acción — antes había que ir aceptando cluster por cluster aunque la IA ya los hubiera marcado para publicar. Sigue llamando a la IA una vez por cluster para redactar el borrador (`NewsArticleService::createFromCluster()`), así que con muchos clusters marcados esto puede tardar varios minutos — por eso corre en `ApplyAiVerdictsJob`, con el mismo patrón de polling descripto arriba. El botón "Aceptar todo lo marcado 'Publicar'" en `/admin/news-review` se habilita solo cuando hay al menos un cluster así (`hasPublishVerdicts`, un `exists()` que manda el controller).

## Caché de las consultas públicas (`App\Services\Public\NewsService`)

Home, trending, categorías y el listado paginado (sin búsqueda) se cachean 5 minutos con `Cache::remember()`. El detalle de un artículo (`findPublishedBySlug`) **no se cachea** — es una consulta por slug indexado, ya es barata, y necesita devolver el `views_count` real.

**Invalidación sin tags:** el driver de caché por defecto de este proyecto (`database`) no soporta cache tags (esa API solo existe en Redis/Memcached), así que en vez de borrar claves puntuales se usa un número de versión (`App\Support\PublicNewsCacheVersion`). Cada clave de caché de `NewsService` incluye la versión actual (`public-news:v{N}:...`); `NewsArticleService::save()` y `delete()` (en el admin) llaman a `PublicNewsCacheVersion::bump()` después de guardar o borrar un artículo, lo que incrementa el número — todas las claves con la versión vieja quedan huérfanas y expiran solas por su TTL de 5 minutos, sin tener que rastrear cuáles borrar.

La búsqueda libre (`?q=...`) explícitamente **no se cachea**: la combinatoria de términos posibles haría que casi nunca haya un hit de caché, así que cachearla sería puro overhead de escritura sin beneficio.

### Bug real: nunca cachear objetos (Eloquent Collections) directamente

La primera versión cacheaba las `Collection` de `NewsArticle` devueltas por `getFeatured()`, `getTrendingTopics()`, `getRelatedArticles()` y el paginador de `getPaginatedArticles()` directo con `Cache::remember()`. Andaba en el primer request (cache miss: `Cache::remember()` devuelve el resultado del closure tal cual, sin pasar por serialización) pero **rompía siempre en el segundo** (cache hit) con:

```
TypeError: App\Services\Public\NewsService::getFeatured(): Return value must be of type
Illuminate\Database\Eloquent\Collection, __PHP_Incomplete_Class returned
```

**Causa:** `config/cache.php` trae `'serializable_classes' => false` — una protección de Laravel (todas las versiones recientes) contra ataques de deserialización de objetos (gadget chains si se filtra el `APP_KEY`). Con esa opción en `false`, **ningún** store de caché (`database`, `file`, `redis`, etc.) reconstruye objetos PHP al leer: `unserialize()` se llama con `['allowed_classes' => false]`, así que cualquier clase (incluida `Illuminate\Database\Eloquent\Collection`) se convierte en `__PHP_Incomplete_Class` en vez de en el objeto real. No es una corrupción de datos — el valor guardado en la tabla `cache` es válido y hasta se puede leer con un `unserialize()` manual sin esa restricción — es Laravel negándose a reconstruirlo por diseño.

**Fix:** `NewsService` ahora cachea solo **IDs** (enteros, 100% serializables sin objetos) y una función privada `hydrateOrdered(array $ids)` rehidrata los modelos completos (`with('tags')`) por esos IDs en cada llamada, preservando el orden original. Sigue evitando la parte cara de la query (filtrar/ordenar/contar sobre toda la tabla); lo único que ya no se cachea es el `SELECT ... WHERE id IN (...)` final, que es barato por ser búsqueda por clave primaria. El paginador de `getPaginatedArticles()` se reconstruye a mano (`new LengthAwarePaginator(...)`) a partir de los IDs de esa página + el total cacheado por separado.

**Nunca** cachear un objeto Eloquent (Model, Collection, Paginator) directo con `Cache::remember()` en este proyecto mientras `cache.serializable_classes` siga en `false` — cachear IDs/arrays y rehidratar es el patrón correcto.

## Contador de vistas por artículo (`App\Services\Public\ArticleViewService`)

Objetivo: contar vistas reales (una por visitante, no una por cada F5) sin escribir en `news_articles` en cada request — con tráfico real, eso satura la tabla y además cada `UPDATE` pisa `updated_at` si se hace vía Eloquent, lo cual además de ser una escritura de más, rompe cualquier cosa que dependa de "cuándo se editó el artículo" (por ejemplo el `lastmod` del sitemap).

**Cómo funciona (`record()`, llamado desde `Public\ArticleController::show()`):**

1. **Deduplicación por visitante** — se genera un fingerprint (`hash(ip + user-agent)`, no hay cuentas de usuario en el sitio público) y se guarda una clave de caché `article-view-seen:{article_id}:{fingerprint}` con TTL de 30 minutos. Si ya existe, la vista no cuenta — evita que recargar la página sume vistas infinitas.
2. **Contador en caché, no en la base** — la vista nueva incrementa `article-views:pending:{article_id}` en caché, y anota el `article_id` en una lista `article-views:pending-ids` para que el flush sepa qué artículos tienen algo pendiente.
3. **Flush en lote (`flushPending()`, corrido por el comando `views:flush` cada minuto)** — por cada `article_id` pendiente, hace **una sola** query `UPDATE news_articles SET views_count = views_count + N WHERE id = ?` vía el query builder plano (`DB::table()`, no Eloquent) — así no dispara eventos de modelo ni toca `updated_at`. Si en un minuto un artículo recibe 50 vistas, es una sola escritura a la base por esos 50, no 50 escrituras.

**Bug real encontrado y corregido durante esta implementación:** `Cache::increment()` sobre una clave que todavía no existe se comporta distinto según el driver. Redis la crea en 0 automáticamente (semántica de `INCR`); los drivers `database` y `file` (este proyecto usa `database`) **no la crean** — el incremento se pierde silenciosamente, sin error. La primera vista de cada artículo no se contaba nunca. Se arregló llamando `Cache::add($key, 0, $ttl)` (no-op si ya existe) antes de `Cache::increment()`. Esto además expuso que el test original daba falsa confianza: corría con `CACHE_STORE=array` (el default de testing), cuyo driver sí auto-inicializa en incremento — por eso `tests/Feature/Public/ArticleViewServiceTest.php` fuerza `config(['cache.default' => 'database'])` en un `beforeEach`, para probar contra el mismo driver que dev/producción.

`getTrendingTopics()` en `NewsService` ahora ordena por `views_count` (ventana de los últimos 14 días) en vez de solo por fecha — "trending" real, no "más reciente" disfrazado de trending. Asimismo, `getPaginatedTrending(int $perPage = 12)` provee la consulta paginada y cacheada para la página dedicada `/tendencias` (`TrendingController`), rehidratando modelos a partir de los IDs cacheados sin romper con `serializable_classes`.

**Trade-off aceptado:** `views_count` puede estar hasta 1 minuto desactualizado (el intervalo del flush) respecto a las vistas que realmente ocurrieron — se prefirió esto a escribir en la base en cada request.

## Sitemap y feed RSS

Dos endpoints públicos sin página de React (XML puro, generado con vistas Blade en `resources/views/sitemap/` y `resources/views/feed/`):

- `GET /sitemap.xml` (`Public\SitemapController`) — home, cada categoría del catálogo, y cada artículo publicado con su `lastmod` (usa `updated_at`, o `published_at` si no fue editado nunca).
- `GET /feed` (`Public\FeedController`) — RSS 2.0 con las últimas 30 noticias publicadas (título, link, resumen, categoría, fecha).

Ambos filtran siempre por `status = 'published'` — un borrador nunca aparece en ninguno de los dos, aunque tenga `published_at` seteado.

**Cacheados con el mismo patrón `PublicNewsCacheVersion` que `NewsService`** (a diferencia de las demás consultas públicas, acá se cachea el XML ya renderizado, no solo IDs): el sitemap traía **todos** los artículos publicados en cada visita sin límite ni caché — con buscadores rastreándolo seguido y el sitio creciendo, era trabajo repetido innecesario. Sitemap 30 min de TTL, feed 15 min (más corto porque un lector de RSS espera ver contenido nuevo más rápido). `PublicNewsCacheVersion::bump()` (llamado por `NewsArticleService` en cada save/toggle/delete) invalida ambos igual que al resto de la caché pública.

## Tests nuevos

- `tests/Feature/Public/ArticleViewServiceTest.php` — dedupe por visitante, que el flush no toque `updated_at`, visitantes distintos cuentan por separado.
- `tests/Feature/Public/SitemapAndFeedTest.php` — ambos endpoints listan solo artículos publicados, y que el sitemap queda cacheado hasta que se hace `bump()`.
- `tests/Feature/Admin/NewsReviewJobsTest.php` — scrape y aplicar-veredictos corren como job (con `QUEUE_CONNECTION=sync` en testing, así que se ejecutan en el mismo request) y el endpoint de estado (`run-status`) devuelve el resultado real.
- `tests/Feature/Admin/AutoReviewNewsCommandTest.php` — `news:auto-review` analiza solo lo que no tiene veredicto todavía, rechaza automáticamente lo marcado `discard`, nunca toca lo marcado `publish`, y no rompe si no hay proveedor de IA activo o no hay nada pendiente.
