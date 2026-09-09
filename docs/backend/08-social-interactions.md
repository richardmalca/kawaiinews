# Interacciones sociales: seguir, me gusta, favoritos y compartidos

Primera fase de perfiles públicos y funciones sociales. Solo backend — la UI del perfil público (`resources/js/pages/public/profile/*`) la arma la sesión de frontend público.

## Paquetes usados

- `overtrue/laravel-follow` — `Follower` (en `User`, para seguir) y `Followable` (en `User`, para ser seguido).
- `overtrue/laravel-like` — `Liker` (en `User`) y `Likeable` (en `NewsArticle`).
- `overtrue/laravel-favorite` — `Favoriter` (en `User`) y `Favoriteable` (en `NewsArticle`).

Las tres tablas (`followables`, `likes`, `favorites`) vienen de las migraciones publicadas de cada paquete (`database/migrations/2018_12_14_*`, `2022_05_02_*`) y usan relaciones polimórficas, así que sirven también para futuros "me gusta"/favoritos en comentarios sin nuevas tablas.

## Modelo de datos propio

- `users.username` — el `@usuario` único y público. Nullable (los usuarios existentes no tienen uno hasta que lo elijan); se valida en `App\Concerns\ProfileValidationRules::usernameRules()` (3-30 caracteres, `[a-zA-Z0-9_.]`, único, no puede ser una palabra reservada como `mi-cuenta`/`admin`/`settings`/`api`/`perfil` porque colisionaría con segmentos de ruta reales). En `/settings/profile` (panel admin) el campo es opcional (`sometimes`/`nullable`, esa UI no lo gestiona); en `/perfil/{username}/settings` (ver más abajo) es obligatorio.
- `users.show_shares_on_profile` — booleano, default `false`. Controla si los compartidos del usuario aparecen en su perfil público (el usuario decide explícitamente mostrar esto).
- `news_articles.author_id` — FK nullable a `users`, `nullOnDelete()`. Se asigna solo cuando un admin/editor acepta un cluster manualmente desde `/admin/news-review` (`NewsReviewController::accept()` pasa `$request->user()->id`); en el flujo automático por lote (`NewsClusterService::acceptAllPublishVerdicts()`, corrido por `ApplyAiVerdictsJob`) no hay un usuario HTTP asociado, así que queda `null`.
- `shares` (tabla propia, no del paquete) — registro/contador de veces que se compartió una noticia: `user_id` (nullable, permite compartidos anónimos), `news_article_id`, `channel` (`whatsapp`/`twitter`/`facebook`/`link`/null).

## Servicios

- `App\Services\Public\ProfileService::buildProfile()` — arma el payload del perfil público: contadores de seguidores/seguidos, si el usuario autor tiene rol `superadmin`/`editor` (único caso en que se calcula `published_articles_count`), si el visitante ya lo sigue, y la lista de compartidos **solo si** `show_shares_on_profile` es `true`.
- `App\Services\Public\ArticleInteractionService` — `toggleLike()`, `toggleFavorite()`, `recordShare()`. Delegan en los traits de los paquetes; el conteo de likers se recalcula desde la relación, no se cachea.

## Rutas y controladores

```
GET  perfil/{username}                        ProfileController::show
POST noticias/{slug}/compartir                 ArticleInteractionController::share   (sin auth: permite compartidos anónimos)
POST perfil/{username}/seguir                  FollowController::toggle              (auth)
POST noticias/{slug}/me-gusta                  ArticleInteractionController::toggleLike    (auth)
POST noticias/{slug}/favorito                  ArticleInteractionController::toggleFavorite (auth)
```

`FollowController::toggle()` lanza un `ValidationException` si el usuario intenta seguirse a sí mismo. Like/favorito solo actúan sobre artículos publicados (reutilizan `NewsService::findPublishedBySlug()`).

## Separación de la configuración de cuenta: `/settings` (staff) vs `/perfil/{username}/settings` (lectores)

Antes de esta fase, `/settings/*` (`routes/settings.php`) era la única página de "mi cuenta" y usaba `AppLayout` — el mismo layout con sidebar del panel `/admin`. Cualquier usuario logueado (incluido un lector público sin rol, que entra vía Google) podía llegar a `/settings/profile` y terminaba viendo el shell de administración, lo cual no tiene sentido para un lector normal.

Se separó en dos superficies:

- **`/settings/*`** — panel admin, ahora con middleware `role:superadmin|admin|editor` en `routes/settings.php`. Sigue siendo `Settings\ProfileController`/`Settings\SecurityController`, sin cambios de lógica, solo la restricción de rol nueva.
- **`/perfil/{username}/settings`** — cuenta del lector público, layout público (sin sidebar admin). Nuevo `App\Http\Controllers\Public\ProfileSettingsController` con `edit`/`update`/`destroy`, protegido por `auth` + verificación de dueño (`$request->user()->username === $username`, si no `403`). Usa `App\Http\Requests\Public\ProfileSettingsUpdateRequest` (mismo trait `ProfileValidationRules`, pero acá `username` es obligatorio) y `ProfileSettingsDeleteRequest`.
  - `GET perfil/mi-cuenta/settings` (`ProfileSettingsController::redirectToSelf`) es el alias estable para quien todavía no tiene `@usuario`: si ya eligió uno, redirige a `perfil/{username}/settings`; si no, debería mostrar una pantalla para elegirlo (`Inertia::render('public/profile/settings/choose-username')` — página aún no creada, es tarea de la sesión de frontend público).

Rutas nuevas en `routes/web.php`, dentro del grupo `auth`:

```
GET    perfil/mi-cuenta/settings        public.profile.settings.self
GET    perfil/{username}/settings       public.profile.settings.edit
PATCH  perfil/{username}/settings       public.profile.settings.update
DELETE perfil/{username}/settings       public.profile.settings.destroy
```

## Pendiente (explícitamente fuera de esta fase)

- UI del perfil público, de `public/profile/settings/edit` y de `public/profile/settings/choose-username` (frontend público).
- Comentarios, moderación de noticias enviadas por usuarios no-editores, sistema de "subir noticia" público.

## Testing

- `tests/Feature/Public/SocialInteractionsTest.php` — follow/unfollow, bloqueo de auto-seguimiento, like/unlike, favorito/unfavorito, compartido logueado y anónimo, visibilidad condicional de compartidos en el perfil.
- `tests/Feature/Public/ProfileSettingsTest.php` — lector sin rol no puede entrar a `/settings/profile` (403), un editor sí puede, redirección de `mi-cuenta/settings` según tenga o no `@usuario`, un usuario puede editar solo su propia configuración pública (403 sobre la de otro), y el username no puede colisionar con una palabra reservada.
- `tests/Feature/Settings/ProfileUpdateTest.php` y `SecurityTest.php` — actualizados para requerir rol staff (antes cualquier usuario podía entrar a `/settings/*`).
