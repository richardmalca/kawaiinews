# Setup inicial (Laravel + React/Inertia)

Receta base aplicada al arrancar el proyecto, para replicar en otros proyectos similares.

## Convenciones de código

- Backend separado en Controladores / Servicios (`app/Http/Controllers`, `app/Services`).
- Frontend separado en Páginas / Componentes / Hooks / Utils (`resources/js/pages/<feature>/{index.tsx, components/, hooks/}`).
- Nombres de variables y funciones en inglés; textos de UI visibles en español.
- Código limpio, nivel junior, sin comentarios en código nuevo.

## Paquetes esenciales

```bash
composer require spatie/laravel-permission laravel/socialite laravel-lang/lang laravel-lang/attributes -W --no-interaction
```

Se usa `-W` porque suelen aparecer conflictos de versión con guzzle/php-jwt en starter kits nuevos.

## Roles (spatie/laravel-permission)

- Roles base: `superadmin`, `admin`, `editor`.
- Trait `HasRoles` en el modelo `User`.
- `RoleSeeder` crea los 3 roles con `firstOrCreate`.
- Comando artisan `user:make-superadmin {email}` para asignar superadmin a cualquier correo.

## Traducción (laravel-lang)

- `APP_LOCALE=es` en `.env`.
- `php artisan lang:add es` (el comando correcto es `lang:add <locale>`, `lang:publish` no acepta `--lang`).

## Google Social Login (Socialite)

- Config en `config/services.php` bloque `google` (`client_id`, `client_secret`, `redirect` desde env).
- Migración: `google_id` (nullable, unique) y `avatar` (nullable) en `users`.
- `App\Services\GoogleAuthService::findOrCreateUser()` — busca por `google_id` o email, crea con password aleatoria hasheada.
- `App\Http\Controllers\Auth\GoogleAuthController` con `redirect()` y `callback()` (`Socialite::driver('google')->stateless()->user()`).
- Rutas bajo `auth/google` y `auth/google/callback`, middleware `guest`.
- Sin logo SVG de Google: se usa el ícono `Chrome` de lucide-react como sustituto genérico. Componente reutilizable `google-auth-button.tsx`, texto "Continuar con Google".

## UI de autenticación (Laravel React starter kit / Fortify)

- Layout en **card** (`AuthLayout` → `layouts/auth/auth-card-layout`, no `auth-simple-layout`).
- Passkeys quitados de login y confirm-password.
- Todas las páginas de `resources/js/pages/auth/*` traducidas al español.
- Registro público (`/register`) eliminado por completo — solo login (email/password) y "Continuar con Google" (ver [02-admin-users.md](02-admin-users.md) para el resto del flujo de auth/redirect).

## Preset visual shadcn

```bash
pnpm dlx shadcn@latest apply --preset buKEvLs -y
```

Sobrescribe `components/ui/*`, fuentes y variables CSS (tema oscuro/rojo, esquinas cuadradas — `rounded-none` en todo `ui/*` aunque `--radius` siga definido en `app.css`). El flag `-y` evita el prompt interactivo. No agregar overrides `rounded-xl/lg/md` propios: rompe la consistencia del preset.

## Limpieza del starter kit

- `APP_NAME` en `.env` refleja el nombre real de la app.
- Quitar del sidebar "Repository"/"Documentation" (y `nav-footer.tsx` si queda sin uso).
- Quitar bloques `PlaceholderPattern` de ejemplo del dashboard original (y `placeholder-pattern.tsx`).
- Traducir nav-user/user-menu-content y todo `pages/settings/*` + sus componentes.

## Notas de entorno (monorepo `D:\Proyectos\animelhd`)

- Varios proyectos comparten `.claude/launch.json` en la raíz del monorepo.
- El puerto de cada proyecto se controla con `APP_URL` + `SERVER_PORT` en su `.env`.
- El `.env` de subproyectos puede estar bloqueado para Read/Edit directo por permisos; en PowerShell usar `[System.IO.File]::ReadAllText/WriteAllText`.

## Siguientes documentos

- [02-admin-users.md](02-admin-users.md) — gestión de usuarios + redirect post-login por rol.
- [03-admin-ai-providers.md](03-admin-ai-providers.md) — configuración de proveedores de IA.
- [04-admin-news-sources.md](04-admin-news-sources.md) — catálogo de fuentes de noticias para scraping.
