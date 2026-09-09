# Modelo de IA (`/admin/ai-providers`)

Configuración de proveedores de IA (Anthropic, OpenAI, Gemini, etc.) usados por la plataforma, gestionada 100% desde UI (sin tocar `.env`), restringida al rol `superadmin`.

## Acceso

- Rutas: `Route::resource('ai-providers', ...)->only(['index','store','update','destroy'])` + `POST ai-providers/{id}/activate` + `POST ai-providers/{id}/test`
- Middleware: `auth`, `verified`, `role:superadmin`

## Arquitectura: catálogo vs. configurado

- `config/ai_catalog.php` — catálogo estático de referencia: qué proveedores existen, qué modelos de texto soporta cada uno, y opcionalmente `image_model` / `audio_model` si ese proveedor también genera imágenes o audio (ver más abajo). No requiere DB ni código nuevo para añadir un proveedor ya soportado por Prism.
- Tabla `ai_providers` (DB) — instancias realmente configuradas: `provider`, `label`, `default_model`, `api_key` (cifrada), `is_active`, `is_active_for_images`, `is_active_for_audio`, `last_verified_at`.

La UI muestra siempre el catálogo completo; cada fila indica si ese proveedor ya está configurado (tiene fila en `ai_providers`) y qué capacidades tiene activas.

## Activación por capacidad (texto / imagen / audio)

Al principio solo existía un `is_active` global, pensado para texto, y la generación de imágenes/audio elegía "el primer proveedor configurado que lo soporte" sin que el usuario pudiera decidirlo. Ahora son **tres interruptores independientes**, uno por capacidad:

| Capacidad         | Columna en `ai_providers` | Quién lo soporta hoy                                                               |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| Texto             | `is_active`               | Los 11 proveedores del catálogo                                                    |
| Imágenes          | `is_active_for_images`    | Solo los que tienen `image_model` en `config/ai_catalog.php` (hoy: OpenAI, Gemini) |
| Audio (narración) | `is_active_for_audio`     | Solo los que tienen `audio_model` en `config/ai_catalog.php` (hoy: solo OpenAI)    |

`AiProviderService::activate(AiProvider $provider, string $capability = 'text')` desactiva esa misma capacidad en todos los demás proveedores y la activa solo en el elegido — un switch exclusivo por capacidad, no un checkbox múltiple. Rechaza silenciosamente (no hace nada) si se intenta activar una capacidad que ese proveedor no soporta (`AiProvider::supportsImages()` / `supportsAudio()`, que solo miran si `config('ai_catalog.{provider}.image_model')` / `.audio_model` está seteado).

Podés tener proveedores distintos activos por capacidad al mismo tiempo (ej. Anthropic para texto, OpenAI para imágenes y audio) — es exactamente el caso de uso que motivó este cambio.

## Backend

| Capa          | Archivo                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Controlador   | `app/Http/Controllers/Admin/AiProviderController.php`                                             |
| Servicio      | `app/Services/Admin/AiProviderService.php`                                                        |
| Modelo        | `app/Models/AiProvider.php` (cast `api_key` => `encrypted`; `supportsImages()`/`supportsAudio()`) |
| Form Requests | `app/Http/Requests/Admin/StoreAiProviderRequest.php`, `UpdateAiProviderRequest.php`               |
| Resource      | `app/Http/Resources/Admin/AiProviderResource.php`                                                 |
| Seeder        | `database/seeders/AiProviderSeeder.php`                                                           |

`AiProviderService` centraliza: `save()`, `activate($provider, $capability)`, `delete()`, `createFromCatalog()`, `catalog()` (merge catálogo + configurados + `supports_image`/`supports_audio` por entrada) y `summary()` (KPIs, incluyendo `active_image`/`active_audio`) y `testConnection()` (llama a Prism con la API key guardada, siempre para texto).

### Motor de conexión: Prism PHP

```php
use Prism\Prism\Facades\Prism;

Prism::text()
    ->using($provider, $model, ['api_key' => $key])
    ->withPrompt('...')
    ->asText();
```

`config/prism.php` ya trae bloques de config para 13 proveedores (openai, anthropic, gemini, groq, mistral, xai, deepseek, ollama, openrouter, perplexity, elevenlabs, voyageai, z) — activar uno nuevo no requiere código adicional, solo agregarlo desde la UI. Prism también expone `Prism::image()` y `Prism::audio()` — ver [07-ai-image-and-audio-generation.md](07-ai-image-and-audio-generation.md).

**Gotcha importante:** nunca usar `AiProvider::where(...)->update([...])` para tocar `api_key` — los mass updates por query builder saltan el cast `encrypted` de Eloquent y guardan el valor en texto plano, corrompiendo la fila (lecturas posteriores lanzan `DecryptException`). Siempre cargar el modelo y usar `$model->update([...])` o `$model->save()`. `AiProviderService::activate()` sí puede usar `AiProvider::where('id','!=',$id)->update([$column => false])` sin problema porque esa columna es un booleano sin cast especial, no la `api_key`.

## Frontend

```
resources/js/pages/admin/ai-providers/
├── index.tsx                          resumen + tabla de catálogo
├── components/
│   ├── ai-provider-summary.tsx        KPIs (instalados, con API key, modelos, activo para imágenes, activo para audio)
│   ├── ai-provider-stat.tsx           tile genérico de KPI
│   ├── ai-provider-catalog-grid.tsx   tabla (no cards), una fila por proveedor del catálogo
│   ├── ai-provider-catalog-row.tsx    fila individual: badges de "Soporta", modelos, "Activo para" por capacidad, agregar/editar
│   ├── add-ai-provider-dialog.tsx     modal de alta (proveedor no configurado)
│   ├── edit-ai-provider-dialog.tsx    modal de edición (editar / probar / eliminar)
│   └── delete-ai-provider-dialog.tsx  confirmación de borrado
└── hooks/
    ├── use-add-ai-provider.ts
    ├── use-save-ai-provider.ts
    ├── use-delete-ai-provider.ts
    ├── use-test-ai-connection.ts
    └── use-ai-provider-summary.ts
```

**De grid de cards a tabla.** Con 11 proveedores en el catálogo, una card grande por proveedor ocupaba demasiado espacio vertical para lo que en el fondo es una lista de datos comparables. Se reemplazó por una tabla compacta (columnas Proveedor / Soporta / Modelos / Activo para / Acciones) — todos los proveedores visibles sin scroll, y la columna "Soporta" muestra de un vistazo qué capacidades tiene cada uno (badge tachado y gris si no la soporta) incluso antes de configurarlo.

**Estado activo explícito, no solo color.** Cada capacidad soportada se muestra como una fila propia: si está activa, un badge de texto "✓ Activado" (no solo un botón de color distinto — depender solo del color es menos accesible y menos claro a simple vista); si no, un botón "Activar {capacidad}".

Toda la gestión (agregar, editar, probar conexión, eliminar) ocurre vía modales; activar una capacidad es un simple `router.post(activate(provider.id).url, {capability})` sin modal. `use-test-ai-connection.ts` usa `useHttp().submit()` de Inertia v3 para el request de verificación (no navega, solo confirma y recarga los props de `providers`).

## Notas

- `last_verified_at` se expone ya formateado (`diffForHumans()`, ej. "hace 3 horas") desde el Resource — nunca mandar el ISO crudo al frontend.
- Un API key de Anthropic debe estar _scoped a un workspace_; una key a nivel organización devuelve 400 `This API key is not scoped to a workspace`.
