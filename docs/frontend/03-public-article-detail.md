# Detalle de noticia (`/noticias/{slug}`)

Vista de lectura individual de un artículo publicado, con diseño editorial, fecha/hora de publicación, firma de redacción, imagen destacada, cuerpo enriquecido, etiquetas y noticias relacionadas.

## Acceso y rutas

- Ruta: `Route::get('noticias/{slug}', [PublicArticleController::class, 'show'])->name('news.show')`
- Middleware: público (sin autenticación requerida)
- Resolución: busca por `slug` exigiendo `status = 'published'` y `whereNotNull('published_at')`. Si no existe o es borrador, devuelve 404 (`firstOrFail`).

## Backend

| Capa        | Archivo                                            |
| ----------- | -------------------------------------------------- |
| Controlador | `app/Http/Controllers/PublicArticleController.php` |
| Servicio    | `app/Services/PublicNewsService.php`               |
| Resource    | `app/Http/Resources/NewsArticleResource.php`       |

### `PublicNewsService`

- `findPublishedBySlug(string $slug)` — localiza el artículo publicado con sus tags cargados.
- `getRelatedArticles(NewsArticle $article, int $limit)` — obtiene hasta 3 noticias publicadas de la misma categoría excluyendo el artículo actual.

### `NewsArticleResource`

Expone los datos de publicación con formatos legibles:

- `published_at` — formato relativo (`hace 2 días`).
- `published_at_formatted` — fecha completa (`01 de septiembre, 2026`).
- `published_at_time` — hora de publicación (`14:00 hrs`).

## Frontend

```
resources/js/pages/public/articles/
├── show.tsx                               Página principal de lectura (grid 12 cols, layout editorial sin cards)
└── components/
    ├── article-header.tsx                 Categoría, título H1 y extracto sin saturación de metadatos
    ├── article-content.tsx                Renderizado de HTML con ritmo tipográfico amplio (interlineado 1.8, márgenes de párrafos y listas)
    ├── article-tags.tsx                   Listado de etiquetas (#anime, #manga)
    ├── article-meta-footer.tsx            Crédito de redacción, fecha completa y hora exacta al pie del artículo
    └── related-articles.tsx               Grid de 3 artículos recomendados al pie a ancho completo
```

### Integración en Portada y Sidebar

- Las tarjetas de noticias (`HeroFeatured`, `NewsCard` y `TrendingSidebar`) enlazan a `/noticias/{slug}`.
- `TrendingSidebar` incluye miniaturas cuadradas (`16x16`, `rounded-xl`, borde sutil y fallback de imagen) para cada noticia popular con efecto hover de zoom, mejorando la riqueza visual tanto en la portada como en el detalle.
