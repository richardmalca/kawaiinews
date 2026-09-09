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

## 5. Narrador de Artículos con Voz Humana / Audio IA

- **Hook**: `resources/js/hooks/use-speech-narrator.ts`
- **Componente**: `resources/js/pages/public/articles/components/article-audio-player.tsx`
- **Ubicación**: Debajo del encabezado en `resources/js/pages/public/articles/show.tsx`.
- **Diseño**:
    - **Botón sutil tipo pastilla de locutor**: Reemplaza el card grande anterior por una cápsula compacta y elegante con ícono de micrófono/locutor (`Mic`), botón de Play con acento rosa y badge de origen ("Audio IA" o "Voz navegador").
    - Elemento nativo `<audio preload="metadata">` para reproducción instantánea y precisa del MP3 en local/servidor.
    - Indicador de estado claro: carga con spinner (`Loader2`), reproducción con onda/pulso animado o pausa.
- **Reproductor Fijo Inferior estilo Spotify**:
    - Al reproducir o pausar la narración (tanto con **Audio IA** como con **Voz del navegador**), se activa la **barra inferior flotante de ancho completo** (`fixed inset-x-0 bottom-0 z-50`):
        - Barra de progreso superior continua con gradiente de marca (`from-rose-500 via-pink-500 to-amber-500`) vinculada al avance real tanto de audio HTML5 como de Web Speech.
        - Lado izquierdo: ícono de audífonos temático, título de la noticia, indicador de origen ("Audio IA" o "Voz navegador") con ícono de locutor y tiempo transcurrido / total estimado en tiempo real.
        - Lado derecho: controles de velocidad (para audio IA), reinicio, Play/Pausa accesible y botón directo de retorno al inicio del artículo.
- Fallback automático e inteligente a síntesis de voz en español (`Web Speech API`) con cálculo dinámico de tiempo transcurrido y duración estimada basada en el contenido del artículo.

## 6. Soporte de Trailers de YouTube en Artículos

- **Estilos de Embed**: En `article-content.tsx`, los contenedores `.aspect-video` e `<iframe>` generados por el backend a partir de trailers oficiales se estilizan con esquinas redondeadas (`rounded-2xl`), bordes adaptativos (`border-neutral-200/80 dark:border-neutral-800/80`) y sombras sutiles integradas con el contenido.

## 7. Página Dedicada de Tendencias (`/tendencias`)

- **Ruta**: `Route::get('tendencias', TrendingController::class)->name('public.trending')`
- **Controlador**: `app/Http/Controllers/Public/TrendingController.php`
- **Servicio**: `NewsService::getPaginatedTrending(12)` (ordena por `views_count` y fecha en los últimos 14 días con caché versionada).
- **Vista**: `resources/js/pages/public/trending/index.tsx`
- **Funcionalidades**:
    - Header temático distintivo con insignias de tendencias.
    - Grid responsivo de tarjetas `NewsCard` con badge numérico de ranking (`01`, `02`, etc.).
    - Paginación integrada vía `HomePagination`.
    - Enlace en Navbar accesible desde cualquier vista y link "Ver todas" en el widget lateral `trending-sidebar.tsx`.

## 8. Copiado de Noticia Completa a Texto Plano Formateado con Pausas

- **Utilidad**: `formatArticleAsPlainText(article)` en `resources/js/lib/public-news-utils.ts`.
    - Limpia etiquetas HTML y formatea título, resumen y párrafos.
    - Agrega pausas de puntuación (`.`) y saltos de línea dobles (`\n\n`) para lectura, narración o motores TTS.
- **Acceso en Frontend**:
    - Barra superior de lectura en el detalle de la noticia (`resources/js/pages/public/articles/show.tsx`).
    - Cabecera del formulario de edición en el panel administrativo (`resources/js/pages/admin/news-articles/edit.tsx`).
- **Footer Responsivo**: Botones de redes sociales compactos (`32x32px`) en `share-buttons.tsx` y texto minimalista en `footer.tsx`.

## 9. Pruebas Automatizadas

- **Archivo**: `tests/Feature/Public/PublicNewsTest.php`
- Cobertura:
    - Exclusión de borradores en portada.
    - Filtrado correcto por ruta de categoría.
    - Búsqueda por palabra clave con parámetro `?q=...`.
    - Acceso al detalle por slug con `whereNotNull('published_at')`.
    - Página `/tendencias` con paginación y ordenamiento por popularidad de visitas.
