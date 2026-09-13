# Perfiles Públicos, Privacidad y Sistema de Notificaciones

Documentación técnica de la experiencia de perfiles de usuario, personalización de identidad, privacidad de pestañas e interacción del sistema de notificaciones en KawaiiNews.

---

## 1. Perfil Público (`/perfil/@{username}`)

- **Vista**: `resources/js/pages/public/profile/show.tsx`
- **Cabecera (`ProfileHeader`)**:
  - Foto de perfil con soporte para Google OAuth o avatar personalizado.
  - Banner en proporción cinematográfica (3:1).
  - Distintivo visual de **"Redactor Oficial"** si el usuario cuenta con roles editoriales (`superadmin` o `editor`).
  - **Métricas consolidadas**:
    - Conteo de seguidores (`followers_count`).
    - Conteo de seguidos (`following_count`).
    - Noticias publicadas (`published_articles_count`, visible si el usuario es redactor o tiene notas).
    - **Total de Me gusta recibidos** (`total_articles_likes_count`): Conteo acumulado de todos los me gusta que la comunidad ha otorgado a las notas escritas por este autor.

---

## 2. Organización de Pestañas y Privacidad de Contenido

En `resources/js/pages/public/profile/components/profile-tabs-section.tsx`, la exposición de contenido está estrictamente segmentada según el tipo de visitante:

| Pestaña | Icono | Audiencia | Descripción |
|---|---|---|---|
| **Noticias publicadas** | `Newspaper` | **Público** | Artículos redactados por el autor con conteo individual de vistas (`views_count`), likes (`likes_count`) y fecha de publicación. |
| **Compartidas** | `Share2` | **Público** (Condicional) | Artículos difundidos por el usuario en redes o enlaces. Solo se exhibe si el usuario activó `show_shares_on_profile`. |
| **Guardadas (Favoritos)** | `Bookmark` | **Solo el dueño** (`is_self`) | Artículos marcados como favoritos para lectura posterior. Oculto para cualquier visitante ajeno. |
| **Me gusta** | `Heart` | **Solo el dueño** (`is_self`) | Noticias a las que el usuario dio "Me gusta". Privado para proteger los gustos personales del lector. |

*Nota: Los comentarios públicos emitidos por el usuario se encuentran desvinculados del perfil público para resguardar la privacidad y focalizar el perfil en autoría y contenido compartido.*

---

## 3. Ajustes de Cuenta y Galería de Banners Anime

- **Ruta**: `/perfil/{username}/ajustes` (alias directo `/perfil/mi-cuenta/ajustes`).
- **Galería de Banners Anime (`AnimeBannerModal`)**:
  - Catálogo interactivo de fondos temáticos en alta resolución (`ANIME_BANNER_PRESETS` en `profile-utils.ts`).
  - Selección inmediata con 1 clic a través de CDN optimizada, eliminando la sobrecarga de subida de archivos pesados.
- **Identidad de Usuario**:
  - Validación y sanitización estricta en tiempo real de `@usuario` (solo caracteres alfanuméricos y guion bajo `_`, longitud máxima de 25 caracteres).
  - Protección de correo electrónico importado desde Google OAuth (campo de solo lectura).

---

## 4. Campana de Notificaciones en Tiempo Real

- **Componente**: `resources/js/components/public/notification-bell.tsx`
- **Ubicación**: Barra de navegación pública (`navbar.tsx`).

### Tipos de Notificaciones Soportadas
1. **Respuestas a Comentarios (`comment_reply`)**: Notifica al usuario cuando alguien responde a uno de sus comentarios en una noticia.
2. **Nuevos Seguidores (`user_follow`)**: Notifica cuando otro miembro de la comunidad comienza a seguir su perfil.
3. **Publicación de Nueva Noticia (`new_article`)**:
   - **Destinatarios**: Usuarios que siguen al autor, usuarios que siguen la categoría de la noticia, o usuarios que siguen cualquiera de sus tags.
   - **Deduplicación Inteligente**: Si un usuario sigue simultáneamente al autor, a la categoría y a un tag, **recibe exactamente 1 notificación** (sin saturación).
   - **Motivo Contextual**: Se indica con precisión la razón más directa del aviso (*"Autor publicó una nueva noticia"*, *"Nueva noticia en Categoría"* o *"Nueva noticia en tag #Tag"*).
   - **Interacción**: Exhibe miniatura de portada, título en negritas, extracto y acceso directo a `/noticias/{slug}` con marcado de lectura instantáneo.
