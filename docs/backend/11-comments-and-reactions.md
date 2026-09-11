# Comentarios y reacciones a comentarios

## El problema: hilos infinitos vs. una UI usable

El pedido fue: comentarios con respuestas, pero cuando alguien responde a
una respuesta (no a la raíz), esa nueva respuesta **no se anida visualmente
más** — se aplana bajo el mismo comentario raíz, igual que en YouTube o
Facebook. Se ve así:

```
Comentario 1
   Respuesta 1 a Comentario 1
   Respuesta 2 a Comentario 1
   Respuesta 3 a Respuesta 2      <- aplanada, pero etiquetada "Respondiendo a @autor-de-respuesta-2"
```

Nunca hay más de 2 niveles de indentación, sin importar cuántas veces se
responda a una respuesta.

## Esquema (`comments` table)

- `parent_id` (nullable, FK a `comments.id`): la raíz del hilo. `null` si
  este comentario ES la raíz. Para cualquier respuesta (directa o a otra
  respuesta), siempre apunta a la raíz — nunca a otra respuesta. Esto es lo
  que logra el aplanado a 2 niveles.
- `reply_to_comment_id` (nullable, FK a `comments.id`, `nullOnDelete`): el
  comentario específico al que se respondió dentro del hilo (puede ser la
  raíz o cualquier otra respuesta). Solo se usa para mostrar
  "Respondiendo a @fulano" en la UI — no afecta el anidado.
- `deleted_at` (soft deletes): permite moderar sin romper referencias
  `reply_to_comment_id` de otras respuestas que citan el comentario borrado.

## La lógica de aplanado (`CommentService::store()`)

Cuando se crea una respuesta, el cliente manda `reply_to_comment_id` =
el comentario específico sobre el que tocó "Responder" (puede ser la raíz
o cualquier respuesta existente). El servicio resuelve:

- Si el target es la raíz (`parent_id === null`): `parent_id` = target,
  `reply_to_comment_id` = `null` (no hace falta etiquetar, ya se sabe que
  responde a la raíz).
- Si el target ya es una respuesta: `parent_id` = `target->parent_id`
  (la raíz del hilo, no el target), `reply_to_comment_id` = target (para
  poder etiquetar a quién se le respondió).

Así, sin importar cuántos niveles de respuesta reales haya, en la base
todo cuelga directo de la raíz con `parent_id`, y `reply_to_comment_id`
lleva el registro de la conversación real para la UI.

## Spoilers

`is_spoiler` (boolean, default `false`) — lo marca el propio autor al
comentar (`is_spoiler` opcional en el POST) o al editar su comentario. Es
solo una bandera de dato: el backend no oculta ni recorta `body`, la UI
del frontend público es la que decide cómo mostrarlo (blur/"click para
revelar spoiler"), igual que en Reddit o MyAnimeList.

## Reacciones

Los comentarios reutilizan el trait `Likeable` de `overtrue/laravel-like`
(mismo mecanismo que los "me gusta" de las noticias, tabla polimórfica
`likes` ya existente) — no se creó un sistema de reacciones aparte.

## Moderación

- El autor puede editar (`update`) y borrar (`delete`) su propio comentario.
- Staff (`superadmin`, `admin`, `editor`) puede borrar cualquier comentario
  (moderación), pero no editar comentarios ajenos.
- Borrar un comentario raíz borra en cascada todas sus respuestas (son
  parte del mismo hilo, no tiene sentido dejarlas huérfanas).

## Endpoints

| Método | Ruta | Auth | Body / Notas |
|---|---|---|---|
| GET | `/noticias/{slug}/comentarios` | No | Query `page`. Pagina comentarios raíz (15 por página), con `replies` ya cargadas y aplanadas |
| POST | `/noticias/{slug}/comentarios` | Sí | `body` (string, 1-2000), `reply_to_comment_id` (opcional, int), `is_spoiler` (opcional, bool) |
| PATCH | `/comentarios/{comment}` | Sí (autor) | `body`, `is_spoiler` (opcional) |
| DELETE | `/comentarios/{comment}` | Sí (autor o staff) | — |
| POST | `/comentarios/{comment}/me-gusta` | Sí | Toggle like, sin body |

Throttle: `store`/`update` 20/min, `me-gusta` 60/min (mismo patrón que
`ArticleInteractionController`).

## Forma de la respuesta (`CommentResource`)

```jsonc
// GET /noticias/{slug}/comentarios
{
  "data": [
    {
      "id": 12,
      "body": "Qué buen capítulo",
      "is_spoiler": false,
      "created_at": "hace 2 horas",
      "created_at_iso": "2026-09-10T18:03:00+00:00",
      "is_edited": false,
      "user": { "id": 3, "name": "Richard", "username": "richard", "avatar": "https://..." },
      "reply_to": null,           // null en la raíz
      "likes_count": 4,
      "has_liked": true,          // según el usuario autenticado que pide la página
      "can_update": true,         // policy resuelta server-side, no hace falta replicarla en el front
      "can_delete": true,
      "replies": [
        {
          "id": 15,
          "body": "Muere el prota en el capítulo final",
          "is_spoiler": true,
          "reply_to": null,       // responde directo a la raíz (id 12)
          "...": "..."
        },
        {
          "id": 18,
          "body": "Respuesta 3 a Respuesta 2",
          "is_spoiler": false,
          "reply_to": { "comment_id": 15, "user_id": 3, "name": "Richard", "username": "richard" },
          "...": "..."
        }
      ]
    }
  ],
  "meta": { "current_page": 1, "last_page": 3, "total": 42 }
}
```

`reply_to` es lo único que el front necesita leer para renderizar
"Respondiendo a @username" sobre una respuesta — no hace falta calcular
nada de jerarquía en el cliente, ya viene aplanado y resuelto.

## Panel de moderación (admin)

`/admin/comments` (solo `superadmin`, mismo nivel que noticias/medios en
el sidebar) — `Admin\CommentController` + `CommentService::adminList()`/
`adminKpis()`. Lista plana (raíces y respuestas mezcladas, sin agrupar
por hilo) con búsqueda por texto, filtro por noticia y filtro
"solo spoilers". Borrar desde acá usa la misma `CommentService::delete()`
(cascada de respuestas si es raíz).

KPIs del panel: total, hoy/semana, cantidad de respuestas vs. raíces,
cantidad marcada spoiler.

## KPIs en el dashboard principal

`DashboardService` (`app/Services/Admin/DashboardService.php`) suma
comentarios en:
- `summary().comments` (total/hoy/semana)
- `growth().comments` (semana actual vs. anterior, mismo patrón que vistas/reacciones)
- `timeline()` — serie diaria de comentarios (últimos 14 días)
- `topArticles()` — cantidad de comentarios por noticia, junto a vistas/likes/shares

## Pendiente (frontend público)

El backend/admin ya está completo. La UI pública de comentarios en
`resources/js/pages/public/articles/show.tsx` la construye la otra
sesión de IA a cargo del frontend público (ya la tiene armada al momento
de escribir esto: `article-comments-section`, `article-comment-item`,
`article-comment-form` aparecen en el build).

## Sobre usar un paquete en vez de esto

Se evaluó reemplazar esto por un paquete de comentarios de terceros
(`beyondcode/laravel-comments`, `actuallymab/laravel-comment`, etc.).
Ninguno resolvía el aplanado a 2 niveles de fábrica (todos hacen anidado
recursivo real, que no era lo pedido) ni soporta `is_spoiler` — así que
se hubiera terminado reescribiendo la mitad de su comportamiento igual,
sumando una dependencia externa sin necesidad real. Se decidió mantener
la implementación propia.

## Tests

`tests/Feature/Public/CommentsTest.php` — 14 tests, incluyendo el caso
exacto reportado (responder a una respuesta se aplana bajo la raíz pero
etiqueta a quién se respondió) y los 3 casos de `is_spoiler`.

## Moderación automática (Capa 1 implementada)

Todo comentario pasa por `CommentModerationService::shouldHoldForReview()`
dentro de `CommentService::store()`, antes de guardarse:

1. **Lista de palabras/frases prohibidas** — `config/comment_moderation.php`
   (`banned_words`), comparación sin distinguir mayúsculas ni acentos.
2. **Spam por links** — más de `max_links` URLs en el mismo comentario, o
   cualquier URL a un dominio que no sea el propio (`config('app.url')`).
3. **Repetición** — mismo usuario posteando el mismo texto
   `max_repeated_comments_per_hour` veces o más en la última hora. Esto es
   un filtro de contenido repetido, no de frecuencia (para eso ya está el
   `throttle:20,1` de la ruta).

Si algo matchea, el comentario **se crea igual** (no se rechaza — estas
reglas tienen falsos positivos) pero con `status = 'pending'` en vez de
`'visible'`. Un comentario `pending`:
- No aparece en `listForArticle()` (lo que ve el público), ni como raíz
  ni como respuesta dentro de otro hilo.
- Sí aparece en `/admin/comments`, con badge "Pendiente" (ámbar) y un
  botón "Aprobar" que lo pasa a `visible`
  (`CommentService::approve()` → `POST admin/comments/{comment}/approve`).
- Se puede filtrar con el switch "Solo pendientes" en el panel
  (`pending_only` en `adminList()`), y el conteo sale en
  `adminKpis().pending`.

Tests: `tests/Feature/Public/CommentModerationTest.php` (9 tests — cada
regla del filtro, que un admin puede aprobar, filtro y KPI del panel).

## Capa 2 — IA, opcional y todavía no implementada

Solo para los que ya cayeron en `pending` por la Capa 1 (volumen bajo),
no para todos los comentarios. Un job en cola le pasaría el texto a un
modelo barato/rápido (ej. `claude-haiku-4-5`) pidiendo clasificación
simple: `OK` / `SPAM` / `TOXICO`. Si el modelo dice `OK`, pasaría a
`visible` solo. Si dice `SPAM`/`TOXICO`, quedaría `pending` para que un
humano decida (la IA no borraría nada sola). No se implementó porque la
Capa 1 sola ya cubre el caso típico de spam de bots — se agrega después
si hace falta más precisión.

### No incluido en este plan

- Baneo automático de usuarios (queda manual, por ahora).
- Shadow-ban (que el autor vea su comentario pero nadie más) — se puede
  agregar después si hace falta, no cambia el esquema de arriba.
