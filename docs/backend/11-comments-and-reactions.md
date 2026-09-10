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

## Pendiente (frontend público)

Este trabajo es solo backend. La UI de comentarios en
`resources/js/pages/public/articles/show.tsx` (input para comentar, hilo
de respuestas aplanado, botones de like/editar/borrar según
`can_update`/`can_delete` del `CommentResource`) la construye la otra
sesión de IA a cargo del frontend público.

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
