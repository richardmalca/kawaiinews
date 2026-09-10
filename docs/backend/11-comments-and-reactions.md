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

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/noticias/{slug}/comentarios` | No | Pagina comentarios raíz, con `replies` ya cargadas y aplanadas |
| POST | `/noticias/{slug}/comentarios` | Sí | `body`, `reply_to_comment_id` opcional |
| PATCH | `/comentarios/{comment}` | Sí (autor) | `body` |
| DELETE | `/comentarios/{comment}` | Sí (autor o staff) | — |
| POST | `/comentarios/{comment}/me-gusta` | Sí | Toggle like |

## Pendiente (frontend público)

Este trabajo es solo backend. La UI de comentarios en
`resources/js/pages/public/articles/show.tsx` (input para comentar, hilo
de respuestas aplanado, botones de like/editar/borrar según
`can_update`/`can_delete` del `CommentResource`) la construye la otra
sesión de IA a cargo del frontend público.

## Tests

`tests/Feature/Public/CommentsTest.php` — 11 tests, incluyendo el caso
exacto reportado (responder a una respuesta se aplana bajo la raíz pero
etiqueta a quién se respondió).
