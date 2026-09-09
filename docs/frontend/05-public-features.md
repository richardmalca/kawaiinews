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

## 3. Buscador Universal con Sugerencias en Vivo y Prevención de Zoom

- **Ubicación UI**: `resources/js/components/public/navbar.tsx` y `resources/js/components/public/search-suggestions-dropdown.tsx`.
- **Desktop**: Campo de búsqueda estilizado con placeholder *"Buscar..."*, atajo `⌘K` e ícono `Search` que expande su ancho al enfocar.
- **Mobile**:
    - Input ajustado a `text-base` (16px) y `maximum-scale=1` en el viewport para prevenir el zoom automático indeseado en iOS Safari y Android Chrome.
    - Botón dedicado que despliega el cajón de búsqueda superior responsivo.
- **Sugerencias en Tiempo Real**:
    - Muestra usuarios con `@usuario`, avatar y badges de redactor/autor.
    - Muestra artículos coincidentes con miniatura y categoría.
    - Debounce de 250ms y protección con limitador de tasa `throttle:60,1` en backend.
- **Backend**:
    - `SearchSuggestionController`: Búsqueda paralela sobre usuarios y artículos publicados.
    - `HomeController`: Recibe el parámetro `?q=...` y renderiza los resultados.
    - `news-section-header.tsx`: Muestra el contador de coincidencias y botón para limpiar la búsqueda.

## 4. Rutas Semánticas por Categoría (`/categoria/{slug}`)

- **Ruta**: `Route::get('categoria/{category}', HomeController::class)->name('public.category')`
- **Navegación**: Enlaces en el navbar y sub-barra redirigen a `/categoria/{slug}`.
- **Estado Activo**: Detecta si la ruta actual coincide con la categoría y aplica el estilo distintivo rosa (`text-rose-600 dark:text-rose-400 bg-rose-500/10`).
- **SEO**: El título dinámico de la página (`Head`) se ajusta automáticamente (ej. `Anime - KawaiiNews` o `Búsqueda: "palabra" - KawaiiNews`).

## 5. Narrador de Artículos con Voz Humana / Audio IA

- **Hook**: `resources/js/hooks/use-speech-narrator.ts`
- **Componente**: `resources/js/pages/public/articles/components/article-audio-player.tsx`
- **Ubicación**: Debajo del encabezado y sincronizado en el sidebar de lectura en `resources/js/pages/public/articles/show.tsx`.
- **Diseño**:
    - **Botón sutil con estimación de duración**: Muestra *"Escuchar (X min)"* antes de iniciar la reproducción, calculando la duración estimada exacta tanto para audio generado como para síntesis de voz.
    - Elemento nativo `<audio preload="metadata">` para reproducción instantánea y precisa del MP3 en local/servidor.
    - Indicador de estado claro: carga con spinner (`Loader2`), reproducción con pulso animado o pausa.
- **Reproductor Fijo Inferior estilo Spotify**:
    - Al reproducir o pausar la narración (tanto con **Audio IA** como con **Voz del navegador**), se activa la **barra inferior flotante de ancho completo** (`fixed inset-x-0 bottom-0 z-50`):
        - Barra de progreso superior continua con gradiente de marca (`from-rose-500 via-pink-500 to-amber-500`) vinculada al avance real.
        - Lado izquierdo: ícono de audífonos temático, título de la noticia, indicador de origen ("Audio IA" o "Voz navegador") con ícono de locutor y tiempo transcurrido / total en tiempo real.
        - Lado derecho: controles de velocidad (para audio IA), reinicio, Play/Pausa accesible, botón directo de retorno al inicio del artículo y botón de **Cerrar (X)** para descartar el reproductor.
    - **Coordinación de Componentes Flotantes**:
        - `BackToTop`: Al activarse el reproductor, se desplaza automáticamente hacia arriba (`bottom-20`) para no solaparse con los controles del audio.
        - `ArticleMobileDock`: En móviles se eleva de forma reactiva (`bottom-20`) para mantener visibles y usables todas las acciones de lectura.
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

## 10. Interacciones Sociales y Perfil Público
 
- **Interacciones en Noticias** (`show.tsx`):
    - **Me gusta (Like)**: Botón con icono de corazón y contador en tiempo real (`POST noticias/{slug}/me-gusta`).
    - **Favoritos (Bookmark)**: Botón para guardar o retirar de favoritos (`POST noticias/{slug}/favorito`).
    - **Compartir con Contador**: Registro dinámico de compartidos vía `POST noticias/{slug}/compartir` en Twitter, WhatsApp, Telegram o enlace copiado, con badge del total de compartidos en `share-buttons.tsx`.
    - **Autoría y Enlace al Perfil**: La cabecera del artículo enlaza al perfil público del redactor (`/perfil/{username}`).
- **Perfil Público de Usuario** (`/perfil/{username}`):
    - Vista `resources/js/pages/public/profile/show.tsx` con banner estilizado, foto de perfil, rol de redactor y contadores de seguidores, seguidos y noticias publicadas.
    - Botón interactivo de seguir/dejar de seguir (`POST perfil/{username}/seguir`).
    - Cuadrícula de artículos compartidos (solo visible si el usuario habilitó `show_shares_on_profile`).
- **Ajustes de Cuenta para Lectores** (`/perfil/{username}/ajustes` y `/perfil/mi-cuenta/ajustes`):
    - Vista `resources/js/pages/public/profile/settings/edit.tsx` con formulario para editar nombre, nombre de usuario público, foto de perfil, portada y privacidad de compartidos.
    - **Inmutabilidad del Correo**: El campo de correo electrónico permanece de solo lectura / deshabilitado con mensaje explicativo, ya que proviene exclusivamente de la autenticación OAuth con Google y no puede modificarse manualmente.
    - **Foto de Perfil (Avatar)**:
        - Opción de alternar entre la foto original importada de Google (`avatar_source = 'google'`) o subir una personalizada (`avatar_source = 'custom'`).
        - Tamaño recomendado mostrado en la interfaz: `400 x 400 px` (formato cuadrado).
        - Límite de peso estricto: máximo `2 MB` (validación instantánea en cliente y validación en backend con `mimes:jpeg,png,webp,gif`).
    - **Imagen de Portada (Banner)**:
    - **Foto de Perfil (Avatar) y Portada (Banner) Optimizados**:
        - **Avatar**: Uso directo y predeterminado de la foto de Google OAuth del usuario, sin requerir subidas locales forzadas al servidor.
        - **Galería de Banners Anime Gratis (Sin Subida de Archivos)**:
            - Catálogo interactivo de fondos temáticos en alta resolución (`ANIME_BANNER_PRESETS` en `profile-utils.ts`) perfectamente adaptados a la proporción 3:1 (`1200 x 400 px`).
            - Asignación instantánea con un solo clic mediante URLs CDN gratuitas y optimizadas, sin consumir espacio de almacenamiento ni ancho de banda de subida en el servidor.
            - El backend valida y admite tanto URLs externas directas como archivos locales opcionales.
    - **Arquitectura Modular con Hooks, Utils y Componentes UI**:
        - **Utilidades dedicadas (`resources/js/pages/public/profile/lib/profile-utils.ts`)**:
            - Constantes `PROFILE_LIMITS` (dimensiones recomendadas de 1200x400 y 400x400, límites de 2MB y 4MB, y longitudes de usuario de 3 a 25 caracteres).
            - Función de validación de archivos `validateImageFile(file, type)`.
            - Extractor seguro de token CSRF `readCsrfToken()`.
        - **Hooks personalizados (`resources/js/pages/public/profile/hooks/`)**:
            - `useProfileSettingsForm`: Encapsula el formulario de Inertia, previews instantáneos con `FileReader`, validación de tamaño/tipo de archivo y control reactivo de la fuente del avatar (`google` vs `custom`).
            - `useProfileFollow`: Encapsula la mutación asíncrona de seguimiento / unfollow y la actualización optimista del contador con rollback en error.
        - **Componentes desacoplados (`resources/js/pages/public/profile/components/`)**:
            - `SettingsHeader`: Barra de navegación con retorno y acceso a ver perfil público.
            - `SettingsBanner` & `SettingsAvatar`: Renderizado limpio con botones *"Elegir fondo"* y *"Subir propia"*.
            - `AnimeBannerModal`: Diálogo modal dedicado (`Dialog`) para explorar y elegir fondos temáticos sin saturar la pantalla principal, con filtros por categoría y previsualización cinematográfica.
            - `SettingsFields`: Campos de texto para nombre, `@usuario` (con sanitizado y validación en vivo) y tarjeta armonizada de Google OAuth para correo no editable.
            - `SettingsPrivacy`: Switch de noticias compartidas.
            - `SettingsDangerZone`: Bloque aislado para confirmación y eliminación de cuenta.
            - `ProfileHeader` & `ProfileSharedArticles`: Componentes de visualización pública en `show.tsx`.
    - Zona de peligro para eliminación permanente de cuenta con confirmación de contraseña.
    - Vista `choose-username.tsx` para usuarios nuevos sin nombre de usuario asignado con validación y sanitización en vivo (`resources/js/lib/username-rules.ts`).
    - Reglas de nombre de usuario: máximo 25 caracteres, minúsculas automáticas, sin espacios (conversión a guion bajo `_`), sin caracteres especiales ni puntos (`/^[a-zA-Z0-9_]+$/`).
    - Detección automática y disparadores interactivos:
        - `ChooseUsernameDialog` (`resources/js/components/public/choose-username-dialog.tsx`): diálogo modal con opción **"Hacer más tarde"** para postergarlo y seguir navegando sin bloqueos forzados.
        - **Bloqueo con apertura inmediata**: Si el usuario omitió la configuración inicial ("Hacer más tarde") e intenta dar "Me gusta", guardar en "Favoritos" o entrar a su perfil, el modal se abre de inmediato exigiéndole completar su `@usuario` antes de ejecutar la acción.
        - `UsernameRequiredBanner` (`resources/js/components/public/username-required-banner.tsx`): aviso superior persistente y discreto con botón interactivo para abrir el modal en cualquier momento.
    - Acceso directo a "Mi perfil público" y "Ajustes de cuenta" desde el menú de usuario en el Navbar (`navbar.tsx`).

## 11. Modal de Inicio de Sesión Público (Google OAuth) y Restricción de Panel
 
- **Modal de Inicio de Sesión** (`resources/js/components/public/login-dialog.tsx`):
    - Apertura en cualquier página pública desde el botón "Iniciar sesión" en `navbar.tsx`.
    - Integración en `useArticleInteractions`: Al intentar dar "Me gusta" o "Favorito" sin estar autenticado, abre el modal en lugar de desviar la navegación.
    - Única opción para lectores: botón accesible "Continuar con Google" (`/auth/google`).
    - Redirección con retorno: envía `return_to` al endpoint `/auth/google`, de modo que tras autorizar en Google, el usuario vuelve exactamente a la noticia o página que estaba leyendo.
- **Restricción de Acceso en Backend (`/login`)**:
    - El formulario de correo y contraseña en `/login` queda reservado exclusivamente para el equipo de redacción (`superadmin`, `admin`, `editor`).
    - Si un usuario registrado con Google intenta ingresar su correo y contraseña en `/login`, `Fortify::authenticateUsing()` rechaza la solicitud indicando: `"Esta cuenta fue creada con Google. Por favor inicia sesión usando el botón 'Continuar con Google'."`
    - Si un usuario sin roles administrativos intenta ingresar en `/login`, se rechaza con: `"El acceso al panel administrativo está restringido al equipo de redacción."`

## 12. Pruebas Automatizadas

- **Archivos**: `tests/Feature/Public/PublicNewsTest.php`, `tests/Feature/Auth/AuthenticationTest.php`, `SocialInteractionsTest.php` y `ProfileSettingsTest.php`.
- Cobertura completa de:
    - Exclusión de borradores en portada.
    - Filtrado correcto por ruta de categoría.
    - Búsqueda por palabra clave con parámetro `?q=...`.
    - Acceso al detalle por slug con `whereNotNull('published_at')`.
    - Página `/tendencias` con paginación y ordenamiento por popularidad de visitas.
    - Follow/unfollow, likes, favoritos, registro de compartidos y privacidad de perfiles.

## 13. Sidebar de Lectura Reactivo, Dock Móvil y Métricas en Portada

- **Sidebar de Acciones de Lectura** (`ArticleActionsPanel.tsx`):
    - Colapsable de forma inteligente: permanece oculto (`max-h-0 opacity-0`) en la parte superior del artículo permitiendo que el widget de *Tendencias* se sitúe arriba.
    - Al desplazarse pasando los 260px, se expande suavemente (`max-h-96 opacity-100`) para ofrecer:
        - Control de narración con duración estimada ("Escuchar (X min)", "Pausar", "Reanudar").
        - Botones de Me gusta y Guardar con contadores en tiempo real.
        - Selector de tamaño de letra (`sm`, `base`, `lg`).
        - Copiado rápido de texto plano formateado.
- **Dock Flotante Móvil** (`ArticleMobileDock.tsx`):
    - Menú inferior responsivo con acceso a las acciones principales de lectura.
    - Ajuste reactivo de altura: se traslada a `bottom-20` al abrirse el minirreproductor de audio flotante.
- **Métricas de Interacción en Portada** (`NewsCard.tsx` y `HeroFeatured.tsx`):
    - Cada card de noticias exhibe los tres contadores clave con carga optimizada (`withCount` sin N+1):
        - ❤️ **Me gusta** (`likers_count`).
        - 🔖 **Guardados** (`favorites_count`).
        - 🔗 **Compartidos** (`shares_count`).

