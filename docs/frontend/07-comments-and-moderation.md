# Sistema de Comentarios y Moderación en Frontend

Documentación técnica de la experiencia interactiva de comentarios en KawaiiNews: arquitectura de hilos aplanados a 2 niveles, manejo de spoilers con revelación visual, y tratamiento de comentarios bloqueados por moderación automática de IA.

---

## 1. Arquitectura de Hilos a 2 Niveles

Para evitar la degradación de la interfaz en pantallas móviles provocada por la indentación infinita, el sistema implementa un aplanado visual estructurado a 2 niveles máximos (patrón idéntico a YouTube):

```text
Comentario Raíz
├── Respuesta 1 (directa al comentario raíz)
├── Respuesta 2 (directa al comentario raíz)
└── Respuesta 3 (respondiendo a @autor-de-respuesta-2, aplanada bajo la raíz)
```

### Componentes Involucrados
- **`ArticleCommentsSection`** (`resources/js/pages/public/articles/components/comments/article-comments-section.tsx`): Contenedor principal con contador de comentarios, formulario superior de comentario raíz, paginación infinita/incremental y lista de comentarios.
- **`ArticleCommentItem`** (`resources/js/pages/public/articles/components/comments/article-comment-item.tsx`): Elemento individual de comentario. Soporta tanto modo raíz como respuesta (`isReply`), y renderiza el formulario contextual de respuesta (`ArticleCommentForm`) cuando el usuario pulsa "Responder".
- **`ArticleCommentForm`** (`resources/js/pages/public/articles/components/comments/article-comment-form.tsx`): Formulario compacto con soporte de atajos de teclado (`Ctrl/⌘ + Enter` para enviar), toggle de spoiler y validaciones de longitud.

---

## 2. Tratamiento de Comentarios Bloqueados por Moderación (`is_blocked`)

Siguiendo la política de moderación automática asistida por IA:
- Un comentario que vulnera las normas comunitarias no se elimina silenciosamente, sino que viaja con `is_blocked: true`.
- **Comportamiento en UI**:
  - El texto real permanece tapado por defecto con un aviso de advertencia:
    > 🚫 **Comentario no permitido — infringe las normas de la comunidad.** [Ver de todos modos]
  - Si el lector hace clic en **"Ver de todos modos"**, el contenido real se revela de inmediato sin realizar peticiones de red adicionales.
  - Los metadatos (autor, fecha relativa, botón de me gusta y botón de responder) se mantienen visibles y operativos para no romper el hilo de respuestas.
  - No se expone el motivo técnico interno emitido por la IA (`moderation_reason`), manteniendo la privacidad del proceso.

---

## 3. Manejo de Spoilers (`is_spoiler`)

- Al redactar o editar un comentario, el usuario puede marcar el botón **Spoiler**.
- En la interfaz de lectura:
  - El cuerpo del comentario se muestra con un filtro difuminado (`blur-xs select-none`).
  - Encima se sitúa un botón flotante: **"Mostrar spoiler"** con ícono `EyeOff`.
  - Al hacer clic, el contenido se vuelve completamente nítido y legible.

---

## 4. Edición y Eliminación en Vivo

- **Autor**: Puede editar el cuerpo del comentario y cambiar su estado de spoiler (`PATCH /comentarios/{id}`), o borrarlo permanentemente.
- **Staff** (`superadmin`, `admin`, `editor`): Dispone de permisos de moderación para eliminar cualquier comentario inapropiado (`DELETE /comentarios/{id}`).
- Al eliminar un comentario raíz, las respuestas hijas asociadas se eliminan en cascada. Se muestra un diálogo de confirmación accesible (`AlertDialog`).
