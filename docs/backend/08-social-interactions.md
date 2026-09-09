# Interacciones sociales: seguir, me gusta, favoritos y compartidos

Primera fase de perfiles públicos y funciones sociales. Solo backend — la UI del perfil público (`resources/js/pages/public/profile/*`) la arma la sesión de frontend público.

## Paquetes usados

- `overtrue/laravel-follow` — `Follower` (en `User`, para seguir) y `Followable` (en `User`, para ser seguido).
- `overtrue/laravel-like` — `Liker` (en `User`) y `Likeable` (en `NewsArticle`).
- `overtrue/laravel-favorite` — `Favoriter` (en `User`) y `Favoriteable` (en `NewsArticle`).

Las tres tablas (`followables`, `likes`, `favorites`) vienen de las migraciones publicadas de cada paquete (`database/migrations/2018_12_14_*`, `2022_05_02_*`) y usan relaciones polimórficas, así que sirven también para futuros "me gusta"/favoritos en comentarios sin nuevas tablas.

## Modelo de datos propio

- `users.username` — el `@usuario` único y público. Nullable por ahora (los usuarios existentes no tienen uno hasta que lo elijan); se valida en `App\Concerns\ProfileValidationRules::usernameRules()` (3-30 caracteres, `[a-zA-Z0-9_.]`, único). La regla usa `sometimes` porque el formulario de `settings/profile` todavía no expone este campo en la UI.
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

## Pendiente (explícitamente fuera de esta fase)

- UI del perfil público y del selector de `@usuario`/toggle de compartidos en `settings/profile`.
- Comentarios, moderación de noticias enviadas por usuarios no-editores, sistema de "subir noticia" público.

## Testing

`tests/Feature/Public/SocialInteractionsTest.php` — cubre follow/unfollow, bloqueo de auto-seguimiento, like/unlike, favorito/unfavorito, compartido logueado y anónimo, y visibilidad condicional de compartidos en el perfil según `show_shares_on_profile`.
