# Plan: qué mostrar cuando un comentario queda oculto por moderación

Handoff para la sesión de frontend público. El backend ya está listo — esto es solo la parte visual.

## Contexto (por qué hace falta esto)

Ahora un comentario puede quedar `pending` (oculto al público) por el filtro automático o por la IA. Hoy simplemente no aparece en el listado — para el resto de los usuarios eso está bien (no hace falta que sepan que existió). Pero el **autor** del comentario, si entra de nuevo a la noticia, tampoco ve rastro de lo que escribió, lo cual es confuso ("¿se guardó o no?").

## Qué pedir al backend (ya expuesto, no hace falta nada nuevo)

`POST /noticias/{slug}/comentarios` (crear comentario) ya devuelve el `CommentResource` completo del comentario recién creado, incluyendo su estado real. Si hace falta agregar un campo `status` visible ahí (hoy no está expuesto al público, solo en el panel admin), pedirlo aparte — es un cambio de una línea de mi lado.

## Qué mostrar en el frontend

1. **Al enviar un comentario que queda retenido**: en vez de agregarlo silenciosamente a la lista (como si se hubiera publicado), mostrar un toast/aviso tipo:
   > "Tu comentario fue enviado y está en revisión. Puede tardar un momento en publicarse."

   Esto evita el "¿se guardó o no?" — el usuario sabe que pasó algo, sin que se le diga explícitamente "nuestro filtro sospecha que es spam/insulto" (eso genera discusiones innecesarias).

2. **Si termina bloqueado por violar las normas** (no es un simple "está en cola", la IA ya lo marcó): no hace falta un mensaje distinto en tiempo real (el usuario ya se fue de la pantalla para cuando la IA responde, corre en segundo plano). Alcanza con lo del punto 1.

3. **Opcional, más elaborado**: si en el futuro se agrega un "Mis comentarios" en el perfil del usuario, ahí sí tendría sentido mostrar el estado real (visible / en revisión) de cada uno propio. No es necesario para ahora.

## Qué NO hacer

- No mostrar el motivo exacto que dio la IA al autor (eso es información interna del panel de moderación, no para el usuario final).
- No mostrar nada distinto a otros usuarios — para ellos, un comentario retenido simplemente no existe.

## Resumen en una línea

Al comentar, mostrar el comentario en la UI como "enviado" con un aviso de "en revisión" en vez de agregarlo directo a la lista visible — así el usuario sabe que se guardó, sin importar si termina publicándose solo o quedando bloqueado.
