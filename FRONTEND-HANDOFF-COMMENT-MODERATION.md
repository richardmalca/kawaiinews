# Plan: comentarios bloqueados por moderación — qué mostrar

Handoff para la sesión de frontend público. El backend ya está listo — esto es la parte visual.

## Qué cambió del lado del backend

Antes, un comentario problemático quedaba `pending` y desaparecía del todo. Ahora hay dos estados distintos:

- **`pending`**: recién retenido por el filtro automático, todavía sin confirmar. Sigue sin aparecer en el listado — como si no existiera, para nadie (ni para el autor en el hilo de otros, aunque a él sí se le puede avisar que quedó en revisión, ver más abajo).
- **`blocked`**: la IA ya confirmó que vulnera las normas de la comunidad. **Este SÍ aparece en el hilo** — `GET /noticias/{slug}/comentarios` lo devuelve igual que cualquier comentario visible, en su lugar correspondiente (por fecha), con el texto real incluido.

## Campo nuevo en la respuesta

Cada comentario (`CommentResource`) ahora trae:

```jsonc
{
  "id": 12,
  "body": "el texto real del comentario, siempre viaja completo",
  "is_spoiler": false,
  "is_blocked": true,   // <-- nuevo
  "is_pending": false,
  // ...el resto igual que antes
}
```

## Qué mostrar

**Igual patrón que ya usan con `is_spoiler`** (tapado por defecto, con opción de revelar) — mismo mecanismo, campo distinto:

- Si `is_blocked: true`, en vez del texto normal mostrar un placeholder tipo:
  > 🚫 **Comentario no permitido** — infringe las normas de la comunidad. [Ver de todos modos]

- Si el usuario hace click en "Ver de todos modos", mostrar el `body` real (ya está en la respuesta, no hace falta pedir nada más al backend).
- El resto del comentario (avatar, nombre, fecha, likes, botón de responder) se muestra normal — solo el texto queda tapado por defecto.
- Si es la raíz de un hilo con respuestas, las respuestas normales de otros usuarios se siguen mostrando bajo él sin problema (no se corta el hilo).

## Al enviar un comentario nuevo (`is_pending`)

Esto no cambió: si `is_pending: true` en la respuesta del POST, mostrar un aviso tipo "Tu comentario está en revisión" en vez de agregarlo a la lista como si ya estuviera publicado — un `pending` recién enviado no va a aparecer si el usuario recarga la página hasta que se resuelva (puede terminar `visible` o `blocked`).

## Qué NO hacer

- No mostrarle al autor ni a nadie el motivo exacto que dio la IA (`moderation_reason` ni siquiera se expone en la API pública, solo en el panel admin).
- No tratar `blocked` igual que `pending` — `blocked` se muestra (tapado), `pending` no se muestra en absoluto.
