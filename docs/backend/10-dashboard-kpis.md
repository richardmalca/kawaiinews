# Panel de KPIs (`/admin`)

El dashboard pasó de una página estática a `App\Http\Controllers\Admin\DashboardController` + `App\Services\Admin\DashboardService`, con gráficos reales (`recharts`) en vez de números sueltos.

## `article_view_daily` — el hueco que había que llenar primero

`news_articles.views_count` es un contador **acumulado total** por artículo (ver [06-scheduling-caching-and-views.md](06-scheduling-caching-and-views.md)) — no tenía ningún desglose por día, así que no había forma de responder "cuántas vistas hubo hoy" o "esta semana" sin reconstruir eso desde cero.

Nueva tabla `article_view_daily` (`news_article_id`, `date`, `views`, único por `(news_article_id, date)`). `ArticleViewService::flushPending()` ahora, además de incrementar `views_count`, hace un `increment()`/`insert()` sobre la fila del día de hoy para ese artículo (lee-modifica-escribe portable entre SQLite/MySQL, sin SQL específico de motor — mismo criterio que el resto del servicio). Con esto, a partir de que se despliega este cambio, cada día queda un registro real; no hay forma de reconstruir el histórico de antes de este cambio (nunca se guardó).

## `App\Services\Admin\DashboardService`

- `summary()` — usuarios (total / nuevos hoy / nuevos esta semana), vistas (total / hoy / esta semana, desde `article_view_daily`), reacciones de hoy (`likes` + `favorites` de hoy sobre `NewsArticle`), compartidos de hoy (`shares` de hoy), artículos (publicados / borradores).
- `timeline(int $days = 14)` — un punto por día con vistas, usuarios nuevos, reacciones y compartidos, agrupando por `date(created_at)` (función portable entre SQLite y MySQL). Días sin actividad quedan en `0`, no se saltean, para que el eje X del gráfico sea continuo.
- `topArticles(int $limit = 8)` — artículos publicados ordenados por `views_count`, con sus likes/favoritos/compartidos contados aparte (sin N+1: se precalculan mapas `id => total` por tabla antes de armar la lista).
- `categoryBreakdown()` — una fila por cada categoría de `config('news_sources_catalog')` (aunque tenga 0 artículos, para que el gráfico de barras muestre todas las categorías reales), con artículos/vistas/likes de esa categoría.

## Frontend (`resources/js/pages/admin/dashboard.tsx`)

- `components/kpi-card.tsx` — tarjeta reutilizable (ícono + valor + sub-etiqueta opcional), mismo patrón visual que `AiProviderStat`.
- `components/dashboard-timeline-chart.tsx` — `LineChart` de `recharts` con 4 series (vistas/reacciones/compartidos/usuarios nuevos) sobre los últimos 14 días.
- `components/dashboard-category-chart.tsx` — `BarChart` comparando vistas y me gusta por categoría ("qué gusta más").
- `components/dashboard-top-articles.tsx` — tabla de las noticias más vistas con sus reacciones/compartidos.

Los colores de los gráficos usan las variables `--color-chart-1..5` que ya existían en `resources/css/app.css` (tema oscuro/claro se resuelve solo, sin lógica extra).

## Tests

- `tests/Feature/Admin/DashboardServiceTest.php` — conteos de `summary()`, agrupado correcto de `timeline()`, orden y datos de `topArticles()`, que `categoryBreakdown()` cubra todas las categorías del catálogo aunque tengan 0 artículos.
- `tests/Feature/Admin/DashboardControllerTest.php` — la página carga con las 4 props esperadas para cualquier rol de staff, un invitado no puede entrar.
- `tests/Feature/Public/ArticleViewServiceTest.php` — nuevo test de que `flushPending()` también registra `article_view_daily`, y que un segundo flush el mismo día suma en vez de pisar el valor.
