# Gestión de usuarios (`/admin/users`)

CRUD de usuarios del panel de administración, restringido a los roles `superadmin` y `admin`.

## Acceso

- Ruta: `Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy'])`
- Middleware: `auth`, `verified`, `role:superadmin|admin` (grupo `admin.*` en `routes/web.php`)
- Un usuario con rol `editor` puede entrar a `/admin` pero no a `/admin/users`.

## Backend

| Capa          | Archivo                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| Controlador   | `app/Http/Controllers/Admin/UserController.php`                         |
| Servicio      | `app/Services/UserService.php`                                          |
| Form Requests | `app/Http/Requests/Admin/StoreUserRequest.php`, `UpdateUserRequest.php` |
| Resource      | `app/Http/Resources/UserResource.php`                                   |

El controlador solo orquesta: valida vía Form Request, delega la lógica al `UserService` (crear, actualizar, eliminar, asignar roles) y devuelve `to_route('admin.users.index')` o el JSON del `UserResource`.

## Frontend

```
resources/js/pages/admin/users/
├── index.tsx                      página principal (tabla + botón crear)
├── components/
│   ├── users-table.tsx            tabla de usuarios
│   ├── create-user-dialog.tsx     modal de creación
│   ├── edit-user-dialog.tsx       modal de edición
│   └── delete-user-dialog.tsx     confirmación de borrado (AlertDialog)
└── hooks/
    ├── use-create-user.ts
    ├── use-update-user.ts
    └── use-delete-user.ts
```

Cada hook envuelve `router.post/put/delete` en un `toast.promise()` de sonner (loading/success/error) y expone `processing`. Los errores de validación se leen inline desde `usePage().props.errors` (Inertia los puebla automáticamente cuando el Form Request falla).

## Redirect post-login por rol

- `app/Services/AuthRedirectService.php::redirectPathFor(User $user)` — devuelve `/admin` si el usuario tiene rol `superadmin`, `admin` o `editor`; `/` en caso contrario.
- `app/Http/Responses/LoginResponse.php` y `TwoFactorLoginResponse.php` implementan los contratos de Fortify (`LoginResponse`/`TwoFactorLoginResponse`) y delegan en `AuthRedirectService`; se enlazan en `app/Providers/FortifyServiceProvider.php::register()`.
- `config('fortify.home')` queda en `/` como fallback.
- No existe `/dashboard`: la ruta se eliminó por completo, junto con `pages/dashboard.tsx` (reemplazada por `pages/admin/dashboard.tsx` para usuarios privilegiados).

## Registro público eliminado

- `Features::registration()` fue quitado de `config/fortify.php`, por lo que las rutas de `/register` ya no existen.
- Los únicos puntos de entrada son login (email/password) y "Continuar con Google".
- Archivos borrados: `pages/auth/register.tsx`, `app/Actions/Fortify/CreateNewUser.php`.
- Los usuarios de Google ya no reciben el rol `editor` automáticamente al registrarse (quedan sin rol hasta que un admin se lo asigne desde este panel).

## Notas

- El primer superadmin se crea por seeder (`RoleSeeder` + registro manual), no hay alta pública de usuarios: solo se crean desde este panel.
- Cuidado al eliminar: no hay protección para no auto-eliminar la cuenta propia logueada; verificar la fila antes de confirmar.
