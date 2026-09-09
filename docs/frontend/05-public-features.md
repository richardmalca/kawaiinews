# Nuevas Funcionalidades Públicas

Implementación de mejoras de experiencia para visitantes en el portal de noticias KawaiiNews: lectura asistida, viralidad en redes, buscador global y navegación semántica por categoría.

## 1. Barra de Progreso de Lectura

- **Componente**: `resources/js/pages/public/articles/components/reading-progress-bar.tsx`
- **Ubicación**: Integrado en `resources/js/pages/public/articles/show.tsx`.
- **Comportamiento**: Se fija inmediatamente debajo del Navbar (`top-16`, `h-1`), con un gradiente continuo de marca (`from-rose-500 via-pink-500 to-amber-500`). Se actualiza fluidamente mediante el hook `useReadingProgress()`.

## 2. Botones de Compartir en Redes y Copiar Enlace

- **Componente**: `resources/js/pages/public/articles/components/share-buttons.tsx`
- **Ubicación**: Integrado en `resources/js/pages/public/articles/components/article-meta-footer.tsx`.
- **Canales soportados**:
  - **X (Twitter)**: Intención con título codificado y URL.
  - **WhatsApp**: Enlace directo a API con mensaje predeterminado.
  - **Telegram**: Formato para compartir canal/chat.
  - **Copiar enlace**: Utiliza `navigator.clipboard` con feedback dinámico instantáneo ("¡Copiado!").

## 3. Buscador Global en Tiempo Real

- **Ubicación UI**: `resources/js/components/public/navbar.tsx`
- **Desktop**: Campo de búsqueda estilizado con icono `Search` que expande su ancho al enfocar.
- **Mobile**: Botón dedicado que despliega un drawer de búsqueda superior accesible.
- **Backend**:
  - `PublicNewsService::getPaginatedArticles`: Aplica filtro `like` sobre `title` y `excerpt` de noticias publicadas.
  - `HomeController`: Recibe el parámetro `?q=...` y lo inyecta a la vista Inertia.
  - `news-section-header.tsx`: Muestra el texto de resultados encontrados y un botón directo para limpiar la búsqueda.

## 4. Rutas Semánticas por Categoría (`/categoria/{slug}`)

- **Ruta**: `Route::get('categoria/{category}', HomeController::class)->name('public.category')`
- **Navegación**: Enlaces en el navbar y sub-barra redirigen a `/categoria/{slug}`.
- **Estado Activo**: Detecta si la ruta actual coincide con la categoría y aplica el estilo distintivo rosa (`text-rose-600 dark:text-rose-400 bg-rose-500/10`).
- **SEO**: El título dinámico de la página (`Head`) se ajusta automáticamente (ej. `Anime - KawaiiNews` o `Búsqueda: "palabra" - KawaiiNews`).

## 5. Pruebas Automatizadas

- **Archivo**: `tests/Feature/PublicNewsTest.php`
- Cobertura:
  - Exclusión de borradores en portada.
  - Filtrado correcto por ruta de categoría.
  - Búsqueda por palabra clave con parámetro `?q=...`.
  - Acceso al detalle por slug con `whereNotNull('published_at')`.
