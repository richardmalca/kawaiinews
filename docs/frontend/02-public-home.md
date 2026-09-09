# Página de inicio (`/`)

Portada principal de noticias para visitantes, conectada exclusivamente a artículos publicados en la base de datos.

## Acceso y rutas

- Ruta: `Route::get('/', HomeController::class)->name('home')`
- Filtro por categoría vía URL: `/?categoria={slug}`
- Paginación estándar: `/?page={numero}&categoria={slug}`

## Backend

| Capa        | Archivo                                      |
| ----------- | -------------------------------------------- |
| Controlador | `app/Http/Controllers/HomeController.php`    |
| Servicio    | `app/Services/PublicNewsService.php`         |
| Resource    | `app/Http/Resources/NewsArticleResource.php` |

### `PublicNewsService`

- `getFeatured($limit)` — artículos publicados ordenados por `published_at` descendente para el banner destacado.
- `getPaginatedArticles($category, $perPage)` — listado paginado filtrable por categoría.
- `getTrendingTopics($limit)` — artículos publicados para el bloque de populares.
- `getCategoriesSummary()` — conteo de noticias publicadas por cada categoría del catálogo.

Filtro estricto: solo se consultan registros con `status = 'published'` y con `published_at` no nulo. Los registros de scraping crudo (`NewsCluster`) quedan completamente fuera del alcance del portal público.

## Frontend

```
resources/js/pages/public/home/
├── index.tsx                           Página principal orquestadora
└── components/
    ├── hero-featured.tsx               Noticia principal en formato banner (solo en portada general)
    ├── news-card.tsx                   Tarjeta de noticia en el grid de dos columnas
    ├── news-section-header.tsx         Título dinámico de la sección y enlace para ver todas las categorías
    ├── trending-sidebar.tsx            Sidebar lateral con noticias populares numeradas
    ├── home-pagination.tsx             Botones de navegación Anterior y Siguiente
    └── home-empty-state.tsx            Vista de estado vacío si una categoría no tiene notas
```

### Comportamiento del Grid y Destacados

- En la portada general (`/`), la noticia más reciente se presenta en el banner `HeroFeatured` y se excluye del grid para no duplicar contenido.
- Al filtrar por una categoría específica (`/?categoria=anime`), el banner se oculta y el grid muestra la totalidad de artículos correspondientes a esa categoría sin filtrar la primera noticia.
