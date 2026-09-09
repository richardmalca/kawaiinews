# Generación de imagen y audio con IA

Sobre la biblioteca de medios ([05-news-review-and-articles.md](05-news-review-and-articles.md)), esta fase agrega: elegir qué proveedor genera imágenes/audio ([03-admin-ai-providers.md](03-admin-ai-providers.md)), vincular cada imagen/audio a su noticia, una biblioteca de audios en el sidebar, y varios ajustes de calidad reales sobre lo que devolvía la IA.

## `media`: `type` + `news_article_id`

La tabla `media` (antes solo imágenes) ahora tiene:

- `type` (`image` | `audio`, default `image`) — para poder listar cada biblioteca por separado (`MediaLibraryService::list()` filtra `image`, `listAudio()` filtra `audio`).
- `news_article_id` (nullable, `nullOnDelete`) — a qué noticia pertenece. Se completa al subir/generar una imagen desde el editor de esa noticia (`MediaLibraryDialog` recibe `newsArticleId={article.id}` y lo manda en cada request), y siempre al generar una narración (`generateNarration()` la asocia directo al artículo que la pidió).

`NewsArticle::media()` (`hasMany`) expone todo lo asociado a un artículo; `NewsArticle::latestAudio()` (`hasOne` con `latestOfMany()`) da el audio más reciente sin tener que cargar toda la relación. `NewsArticleResource` (Shared) expone `audio_url` a partir de esa relación.

## Generar imágenes

`MediaLibraryService::generateWithAi(string $prompt, ?int $newsArticleId)`:

1. **Elige proveedor** (`resolveImageProvider()`): primero el que el usuario marcó `is_active_for_images` en Modelo de IA; si ninguno, cae al primer proveedor configurado que tenga `image_model` en `config/ai_catalog.php` (hoy: OpenAI o Gemini) — así no rompe instalaciones que todavía no usaron el selector por capacidad.
2. Llama a `Prism::image()->using($provider, $model)->withPrompt($prompt)->generate()`.
3. Si la respuesta trae `base64` (caso normal de `gpt-image-1`), decodifica y guarda el PNG en `storage/app/public/media/`; si trae `url` en cambio (algunos proveedores), guarda esa URL directo sin descargar el archivo.

### El prompt viene armado desde el frontend (`edit.tsx`)

```ts
const aiImagePrompt = isContentComplete
    ? `Ilustración editorial en formato panorámico (16:9) para una noticia sobre: ${excerpt}. Contexto adicional: ${plainBody.slice(0, 500)}. Estilo prolijo y atractivo, colores vibrantes, buena composición. No incluyas ningún texto, letra, título, cartel ni palabra escrita dentro de la imagen — solo la ilustración.`
    : null;
```

Solo se habilita (`isContentComplete`) cuando título + resumen + contenido ya están completos, y ya no cita el título entre comillas como antes.

### Dos bugs reales encontrados generando en vivo

- **`dall-e-3` ya no existe para cuentas/proyectos nuevos de OpenAI** — devolvía `400 image_generation_user_error: The model 'dall-e-3' does not exist.`. Se cambió `image_model` de OpenAI en `config/ai_catalog.php` a **`gpt-image-1`** (el reemplazo actual), que además es el que Prism sabe parsear correctamente (siempre `b64_json`, nunca URL).
- **`gpt-image-1` tarda más de 30s** (el timeout HTTP por defecto de Prism) — en pruebas reales tardó entre 20 y 60s. Se agregó `->withClientOptions(['timeout' => 120])` al request de imagen, igual que ya se hacía para el análisis en lote de la bandeja de revisión.

### Formato panorámico (16:9) y sin texto renderizado

El pedido original generaba imágenes verticales (`1024x1536`, relación 2:3) y con el título literal dibujado como cartel dentro de la imagen (ej. un banner "10TH ANNIVERSARY"), porque el prompt citaba el título entre comillas ("una noticia **titulada** 'X'") y el modelo lo interpretaba como texto a renderizar.

Fix en dos partes:

1. **`MediaLibraryService::IMAGE_ASPECT_OPTIONS`** — opciones específicas por proveedor pasadas vía `withProviderOptions()`:
    ```php
    private const IMAGE_ASPECT_OPTIONS = [
        'openai' => ['size' => '1536x1024'], // gpt-image-1 solo acepta 3 tamaños fijos; este es el más ancho (3:2, no hay 16:9 exacto)
        'gemini' => ['aspect_ratio' => '16:9'], // imagen-4 sí acepta relación de aspecto libre
    ];
    ```
2. **El prompt dejó de citar el título** y agregó una instrucción explícita de "no incluyas ningún texto, letra, título, cartel ni palabra escrita" (ver arriba). Verificado en vivo: la segunda generación quedó panorámica (1536×1024 real) y sin oraciones/carteles dibujados (solo quedó un "10" decorativo suelto, ligado al "diez años" del contexto — no texto de título).

### Costo real: `quality: medium` (se probó `low` primero)

Generar 3 imágenes sin fijar `quality` costó **$1.14 en la cuenta real** de OpenAI — `gpt-image-1` usa `high` por defecto si no se especifica (~$0.17–0.19 por imagen panorámica). Primero se fijó `'quality' => 'low'` (~$0.02–0.03) para minimizar costo, pero se notaba con poco detalle en las pruebas reales; se subió a **`medium`** (~$0.06–0.07, todavía 2-3 veces más barato que `high`) como el balance elegido entre nitidez y costo. Vive en `IMAGE_ASPECT_OPTIONS['openai']`, cambiarlo ahí si hace falta ajustar de nuevo.

### El prompt referencia el estilo visual real de la franquicia

El prompt (armado en `edit.tsx`) le pide al modelo identificar de qué anime/videojuego/franquicia trata el título de la noticia y usar su ambientación, paleta y estilo general como **referencia de inspiración** — explícitamente "sin copiar personajes ni logos reales, con tu propio estilo artístico". Es una referencia por texto (no una imagen real de la obra como input), así que el resultado no reproduce personajes reconocibles con exactitud — sigue siendo una ilustración genérica "al estilo de", más cercana a la temática real que antes de este ajuste, pero no una representación fiel de personajes con copyright (ver la sección de abajo sobre esa limitación, que sigue aplicando).

## Generar audio (narración)

`MediaLibraryService::generateNarration(NewsArticle $newsArticle)`:

1. **Elige proveedor** (`resolveAudioProvider()`), mismo criterio que imágenes pero mirando `is_active_for_audio` / `audio_model`. Hoy solo OpenAI tiene `audio_model` en el catálogo.
2. Arma el guion (`buildNarrationScript()`): título + resumen + cuerpo sin HTML, recortado a 3500 caracteres (límite de la API de texto-a-voz).
3. Llama a `Prism::audio()->using(...)->withInput($script)->withVoice('shimmer')->withProviderOptions([...])->asAudio()`.
4. Decodifica el `base64` de la respuesta y guarda el mp3 en `storage/app/public/audio/`.

### Modelo y tono: por qué `gpt-4o-mini-tts` y no `tts-1`

Se usa **`gpt-4o-mini-tts`** (no el `tts-1` clásico) porque acepta el parámetro `instructions`, que permite pedirle explícitamente un tono de lectura en vez de la voz plana/robótica por defecto:

```php
'instructions' => 'Habla como un/a locutor/a de noticias de entretenimiento: cálido, natural y con ritmo conversacional, con las pausas y la entonación de una persona real contando algo que le interesa. Nada de tono robótico, monótono o de lectura mecánica.',
```

Verificado en vivo: audio real de ~2 minutos por noticia, formato mp3 128kbps mono, sin errores.

## Biblioteca de audios (`/admin/audio-library`)

Página nueva en el sidebar (grupo "Contenido", junto a Noticias), listando **todo** el `Media` con `type = audio`:

```
resources/js/pages/admin/audio-library/
└── index.tsx     tabla: noticia (link a editarla) / reproductor <audio> / fecha / borrar
```

Backend: `MediaLibraryController::audioIndex()` (`GET admin/audio-library`) renderiza la página con `MediaLibraryService::listAudio()` (incluye `newsArticle` cargado para el link). El editor de cada noticia (`ArticleAudioCard`, en el sidebar de `edit.tsx`) también muestra y permite generar el audio de esa noticia puntual sin salir del editor.

## Subida manual de archivos de audio

Además de la narración generada por IA, el sistema permite subir archivos de audio directamente desde el selector de audios (`AudioLibraryDialog` en el editor de noticias):

- **Ruta Backend**: `POST admin/audio` (`admin.audio.store`) gestionada por `MediaLibraryController::storeAudio()`.
- **Validación** (`StoreAudioUploadRequest`):
    - Archivo `file`: requerido, tipo archivo binario de audio (`mimes:mp3,wav,ogg,m4a,aac`), máximo 20MB.
    - `news_article_id`: opcional, valida existencia contra la tabla `news_articles,id`.
- **Servicio** (`MediaLibraryService::storeAudioUpload()`):
    - Almacena el archivo en el disco público dentro del directorio `audio`.
    - Registra el registro `Media` con `type = 'audio'`, `file_path`, `file_name`, `mime_type`, `size` y asocia el `news_article_id` si fue proporcionado.
- **Frontend**:
    - `AudioLibraryDialog` cuenta con botón "Subir archivo" y un input file oculto.
    - El hook `useAudioLibrary` implementa la función `uploadAudio(file: File)` que realiza la petición `multipart/form-data` con token CSRF y refresca la lista.

## Tests

- `tests/Feature/Admin/MediaArticleLinkTest.php` — imagen subida/generada queda vinculada al artículo (`news_article_id`), narración generada crea un `Media` `type=audio` vinculado, `listAudio()` no mezcla imágenes con audios (usa `Prism::fake()` con `AudioResponse`/`GeneratedAudio` para no llamar a la API real).
- `tests/Feature/Admin/MediaLibraryControllerTest.php` — subida manual de audio vía `POST admin/audio`, validaciones de tipo MIME y tamaño máximo.

## Pendiente / no cubierto acá

- Video: evaluado y descartado por ahora — Prism no tiene generación de video implementada para ningún proveedor; agregarlo requeriría integrar la API de un proveedor (ej. Sora de OpenAI) a mano, sin ayuda de la librería.
