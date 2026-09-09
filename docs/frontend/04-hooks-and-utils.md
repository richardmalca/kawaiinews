# Hooks y Utilidades Compartidas del Frontend

Centralización de funciones auxiliares, constantes globales y hooks reutilizables para el portal público y componentes compartidos.

## Utilidades Globales (`resources/js/lib/`)

### `resources/js/lib/public-news-utils.ts` (re-exportado en `resources/js/lib/utils.ts`)

- **`FALLBACK_IMAGES`**: Diccionario centralizado de URLs de imagen de respaldo con tamaños optimizados:
  - `hero`: Resolución grande para portadas y cabeceras destacadas (`1200px`).
  - `card`: Resolución intermedia para tarjetas del grid (`600px`).
  - `thumbnail`: Resolución cuadrada para barras laterales y widgets (`300px`).
- **`handleImageFallback(e, fallbackUrl)`**: Manejador global del evento `onError` en elementos `<img>`. Si la imagen externa falla o arroja 404, la reemplaza automáticamente por el fallback sin bucles infinitos.
- **`formatNewsRanking(index)`**: Formatea índices numéricos a dos dígitos (`01`, `02`, etc.) con fuente monoespaciada para rankings de popularidad.

### `resources/js/components/public/category-badge.tsx`

- **`getCategoryBadgeStyle(category)`**: Función utilitaria exportada para obtener las clases de color Tailwind según la categoría de la noticia (anime, manga, gaming, geek, japón, películas).

## Hooks Globales (`resources/js/hooks/`)

### `resources/js/hooks/use-reading-progress.ts`

- Hook React que calcula el porcentaje de avance de lectura (`0` a `100%`) acotado al contenedor principal del artículo (`targetSelector = 'article'`).
- Al terminar el cuerpo y pie del artículo (sin esperar al bloque de noticias relacionadas ni al footer de la página), la barra alcanza el 100% de manera natural.

