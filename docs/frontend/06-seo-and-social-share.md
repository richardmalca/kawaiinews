# Suite de SEO, Open Graph y Compartir Enriquecido

Documentación técnica de la implementación de posicionamiento en buscadores (SEO), metaetiquetas Open Graph / Twitter Cards, microdatos estructurados Schema.org (JSON-LD) y el sistema desacoplado de compartir en redes sociales con emojis temáticos y Web Share API.

---

## 1. Arquitectura de SEO

### 1.1 Componente Maestro `<SeoHead />`
- **Ubicación**: `resources/js/components/common/seo-head.tsx`
- **Propósito**: Centralizar y estandarizar todas las etiquetas `<head>` dinámicas para motores de búsqueda y rastreadores de redes sociales en Inertia.js.

#### Etiquetas Soportadas
- **Básicas**:
  - `<title>`: Título compuesto con el sufijo `- KawaiiNews`.
  - `<meta name="description">`: Descripción personalizada o extracto del artículo con fallback predeterminado del portal.
  - `<link rel="canonical">`: URL canónica absoluta para evitar contenido duplicado.
  - `<meta name="robots">`: `index, follow, max-image-preview:large` (o `noindex, nofollow` configurable).
- **Open Graph (Facebook, WhatsApp, Discord, LinkedIn)**:
  - `og:site_name`: `KawaiiNews`.
  - `og:type`: `article`, `website` o `profile`.
  - `og:title`, `og:description`, `og:url`, `og:image`, `og:locale` (`es_LA`).
  - Específicas de artículos: `article:published_time`, `article:modified_time`, `article:section`, `article:tag`.
- **Twitter / X Cards**:
  - `twitter:card`: `summary_large_image` para imágenes grandes en alta resolución.
  - `twitter:site`: `@KawaiiNews`.
  - `twitter:title`, `twitter:description`, `twitter:image`.

### 1.2 Datos Estructurados Schema.org (JSON-LD)
El componente inyecta automáticamente un bloque `<script type="application/ld+json">`:
- **Artículos de Noticias (`NewsArticle`)**:
  - `headline`: Título del artículo.
  - `description`: Extracto o resumen.
  - `image`: Imagen destacada del artículo.
  - `datePublished`: Fecha de publicación en formato ISO-8601 (`published_at_iso`).
  - `dateModified`: Fecha de última edición en formato ISO-8601 (`updated_at_iso`).
  - `author`: Objeto `Person` con nombre y enlace al perfil del autor (`/perfil/{username}`).
  - `publisher`: Objeto `Organization` con nombre y logo oficial del portal.
  - `articleSection`: Categoría del artículo.
  - `keywords`: Lista de etiquetas (`tags`) asociadas.
- **Página Principal / Categorías (`WebSite`)**:
  - `name`: `KawaiiNews`.
  - `url`: Origen canónico del portal.
  - `potentialAction`: Objeto `SearchAction` con plantilla de consulta `/?q={search_term_string}` para que los buscadores reconozcan el cuadro de búsqueda del sitio directamente en las SERPs.

---

## 2. Hook de Compartir Enriquecido (`useShare`)

- **Ubicación**: `resources/js/hooks/use-share.ts`
- **Propósito**: Desacoplar la lógica de formateo, textos, enlaces y eventos al compartir noticias en distintas plataformas.

### 2.1 Emojis Temáticos y Formatos por Red Social
El hook detecta la categoría de la noticia y selecciona automáticamente el emoji correspondiente:
- **Anime**: 🌸
- **Manga**: 📖
- **Gaming**: 🎮
- **Tecnología / Tech**: ⚡
- **Cultura**: 🍱
- **Otras**: ✨

#### Plantillas Generadas
- **WhatsApp**:
  ```text
  🌸 *[Título de la noticia]*

  [Extracto del artículo]

  👉 Léelo completo en KawaiiNews:
  [URL Canónica]
  ```
- **X (Twitter)**:
  - Título precedido por el emoji correspondiente.
  - Inclusión de hashtags dinámicos: `#Anime, #KawaiiNews, #{Categoria}`.
- **Telegram**:
  - Texto con titular en negritas, extracto y enlace enriquecido.
- **Facebook**:
  - Enlace directo a `https://www.facebook.com/sharer/sharer.php?u=...`.

### 2.2 Compartir Nativo Móvil (Web Share API)
- Detecta si el navegador soporta `navigator.share`.
- Si está disponible, muestra un botón directo con ícono de smartphone (`Smartphone`) en dispositivos móviles.
- Si no está soportado o se encuentra en escritorio, utiliza el fallback de copiado al portapapeles (`navigator.clipboard`) con confirmación visual `"¡Copiado!"`.

---

## 3. Integración en Componentes

### 3.1 `ShareButtons`
- **Ubicación**: `resources/js/pages/public/articles/components/share-buttons.tsx`
- Consume el hook `useShare`.
- Muestra los accesos a **X (Twitter)**, **WhatsApp**, **Telegram**, **Facebook**, **Compartir Nativo Móvil** y **Copiar Enlace**.
- Dispara la mutación hacia el backend (`/noticias/{slug}/compartir`) registrando el canal utilizado (`whatsapp`, `twitter`, `facebook`, `telegram`, `native`, `link`).

### 3.2 Vistas Públicas con `SeoHead`
- **Detalle de Artículo**: `resources/js/pages/public/articles/show.tsx`
- **Portada y Categorías**: `resources/js/pages/public/home/index.tsx`
- **Perfil Público**: `resources/js/pages/public/profile/show.tsx`
