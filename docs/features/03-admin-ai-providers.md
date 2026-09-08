# Modelo de IA (`/admin/ai-providers`)

Configuración de proveedores de IA (Anthropic, OpenAI, Gemini, etc.) usados por la plataforma, gestionada 100% desde UI (sin tocar `.env`), restringida al rol `superadmin`.

## Acceso

- Rutas: `Route::resource('ai-providers', ...)->only(['index','store','update','destroy'])` + `POST ai-providers/{id}/activate` + `POST ai-providers/{id}/test`
- Middleware: `auth`, `verified`, `role:superadmin`

## Arquitectura: catálogo vs. configurado

- `config/ai_catalog.php` — catálogo estático de referencia: qué proveedores existen y qué modelos soporta cada uno (label + lista de model IDs). No requiere DB ni código nuevo para añadir un proveedor ya soportado por Prism.
- Tabla `ai_providers` (DB) — instancias realmente configuradas: `provider`, `label`, `default_model`, `api_key` (cifrada), `is_active`, `last_verified_at`.

La UI muestra siempre el catálogo completo; cada card indica si ese proveedor ya está configurado (tiene fila en `ai_providers`) y si es el activo.

## Backend

| Capa | Archivo |
|---|---|
| Controlador | `app/Http/Controllers/Admin/AiProviderController.php` |
| Servicio | `app/Services/AiProviderService.php` |
| Modelo | `app/Models/AiProvider.php` (cast `api_key` => `encrypted`) |
| Form Requests | `app/Http/Requests/Admin/StoreAiProviderRequest.php`, `UpdateAiProviderRequest.php` |
| Resource | `app/Http/Resources/AiProviderResource.php` |
| Seeder | `database/seeders/AiProviderSeeder.php` |

`AiProviderService` centraliza: `save()`, `activate()` (desactiva los demás), `delete()`, `createFromCatalog()`, `catalog()` (merge catálogo + configurados), `summary()` (KPIs) y `testConnection()` (llama a Prism con la API key guardada).

### Motor de conexión: Prism PHP

```php
use Prism\Prism\Facades\Prism;

Prism::text()
    ->using($provider, $model, ['api_key' => $key])
    ->withPrompt('...')
    ->asText();
```

`config/prism.php` ya trae bloques de config para 13 proveedores (openai, anthropic, gemini, groq, mistral, xai, deepseek, ollama, openrouter, perplexity, elevenlabs, voyageai, z) — activar uno nuevo no requiere código adicional, solo agregarlo desde la UI.

**Gotcha importante:** nunca usar `AiProvider::where(...)->update([...])` para tocar `api_key` — los mass updates por query builder saltan el cast `encrypted` de Eloquent y guardan el valor en texto plano, corrompiendo la fila (lecturas posteriores lanzan `DecryptException`). Siempre cargar el modelo y usar `$model->update([...])` o `$model->save()`.

## Frontend

```
resources/js/pages/admin/ai-providers/
├── index.tsx                          resumen + grid de catálogo
├── components/
│   ├── ai-provider-summary.tsx        KPIs (instalados, con API key, modelos)
│   ├── ai-provider-stat.tsx           tile genérico de KPI
│   ├── ai-provider-catalog-grid.tsx   grid de cards, una por proveedor del catálogo
│   ├── ai-provider-catalog-card.tsx   card individual: agregar / editar / activar
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

Toda la gestión (agregar, editar, probar conexión, eliminar, activar) ocurre dentro de la card del catálogo, vía modales — no hay ninguna lista ni formulario permanentemente expandido. `use-test-ai-connection.ts` usa `useHttp().submit()` de Inertia v3 para el request de verificación (no navega, solo confirma y recarga los props de `providers`).

## Notas

- `last_verified_at` se expone ya formateado (`diffForHumans()`, ej. "hace 3 horas") desde el Resource — nunca mandar el ISO crudo al frontend.
- Un API key de Anthropic debe estar *scoped a un workspace*; una key a nivel organización devuelve 400 `This API key is not scoped to a workspace`.
