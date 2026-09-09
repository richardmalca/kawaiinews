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

## Patrón de sidebar por grupos

El sidebar (`resources/js/components/app-sidebar.tsx`) no arma un único listado plano de enlaces: los separa en grupos temáticos usando varias instancias de `NavMain` (`resources/js/components/nav-main.tsx`), cada una con su propio `label` (título de sección) y su propia lista de `items`.

Cómo funciona:

- `NavMain` recibe `{ label: string; items: NavItem[] }` y renderiza un `SidebarGroup` con `SidebarGroupLabel` = `label`.
- Si `items` está vacío, `NavMain` devuelve `null` — el grupo directamente no se pinta. Esto permite declarar un grupo "reservado" en el código (con su array de items vacío) sin que se vea una sección vacía en la UI hasta que tenga contenido real.
- En `AppSidebar`, cada grupo se arma como su propio array (`platformNavItems`, `externalServicesNavItems`, etc.), filtrando por rol con el mismo patrón spread condicional que ya se usaba (`...(condición ? [...] : [])`).
- Los grupos se renderizan en orden, uno debajo del otro, dentro de `SidebarContent`.

Grupos usados hasta ahora:

- **Plataforma** — navegación core de la app (Panel, Usuarios).
- **Servicios externos** — configuración de integraciones que la app consume desde afuera (Modelo de IA, Fuentes de noticias). Cualquier feature nueva que sea "conectar la app a un servicio de terceros" va acá.
- **Mantenimiento** — reservado para herramientas operativas (logs, colas, backups, cache, etc.) cuando existan; por ahora su array de items está vacío a propósito y no aparece en el sidebar.

Para agregar un grupo nuevo: crear el array de items correspondiente en `AppSidebar`, agregar un `<NavMain label="..." items={...} />` en `SidebarContent`, y listo — no hace falta tocar `NavMain` salvo que el grupo necesite un comportamiento distinto al de mostrar/ocultar según si tiene items.

## Notas de entorno (monorepo `D:\Proyectos\animelhd`)

- Varios proyectos comparten `.claude/launch.json` en la raíz del monorepo.
- El puerto de cada proyecto se controla con `APP_URL` + `SERVER_PORT` en su `.env`.
- El `.env` de subproyectos puede estar bloqueado para Read/Edit directo por permisos; en PowerShell usar `[System.IO.File]::ReadAllText/WriteAllText`.

## Siguientes documentos

- [02-admin-users.md](02-admin-users.md) — gestión de usuarios + redirect post-login por rol.
- [03-admin-ai-providers.md](03-admin-ai-providers.md) — configuración de proveedores de IA.
- [04-admin-news-sources.md](04-admin-news-sources.md) — catálogo de fuentes de noticias para scraping.
- [05-news-review-and-articles.md](05-news-review-and-articles.md) — bandeja de revisión con relevancia + CMS de artículos.
