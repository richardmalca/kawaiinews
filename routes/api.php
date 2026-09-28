<?php

use App\Http\Controllers\Api\Auth\AuthController as ApiAuthController;
use App\Http\Controllers\Api\Public\NewsController;
use App\Http\Controllers\Api\Public\ProfileController as ApiProfileController;
use App\Http\Controllers\Api\Public\PushSubscriptionController;
use App\Http\Controllers\Api\Public\SiteSettingController as ApiSiteSettingController;
use App\Http\Controllers\Public\ArticleInteractionController;
use App\Http\Controllers\Public\CommentController;
use App\Http\Controllers\Public\NotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('news')->group(function () {
    Route::get('/', [NewsController::class, 'index']);
    Route::get('/{slug}', [NewsController::class, 'show']);
});

Route::get('tags/buscar', [NewsController::class, 'searchTags']);

Route::get('profile/buscar', [ApiProfileController::class, 'search']);
Route::get('profile/{username}', [ApiProfileController::class, 'show']);
Route::post('profile/{username}/seguir', [ApiProfileController::class, 'toggleFollow'])
    ->middleware('auth:sanctum');

Route::get('site-settings', ApiSiteSettingController::class);

// Suscripción push por dispositivo/navegador, no por cuenta -- pública a
// propósito, cualquier visitante puede activarla sin loguearse.
Route::post('push/subscribe', [PushSubscriptionController::class, 'store']);
Route::post('push/unsubscribe', [PushSubscriptionController::class, 'destroy']);

// Sesión del frontend Next.js: token de Sanctum (no cookie de sesión web,
// son dos apps en dos puertos distintos). El login en sí pasa por las
// rutas web de Google OAuth (routes/web.php) que, al detectar que viene
// del frontend Next, emiten el token acá en vez de loguear por sesión.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [ApiAuthController::class, 'me']);
    Route::patch('/auth/profile', [ApiAuthController::class, 'updateProfile']);
    Route::post('/auth/avatar', [ApiAuthController::class, 'updateAvatar'])
        ->middleware('throttle:10,1');
    Route::post('/auth/banner', [ApiAuthController::class, 'updateBanner'])
        ->middleware('throttle:10,1');
    Route::post('/auth/logout', [ApiAuthController::class, 'logout']);
    Route::delete('/auth/account', [ApiAuthController::class, 'deleteAccount']);
});

// Comentarios e interacciones (me gusta, favorito, reacciones, compartir):
// reutilizan tal cual CommentController y ArticleInteractionController de
// routes/web.php — esos controladores ya devuelven JSON puro y usan
// $request->user(), que funciona igual con el guard "web" (Inertia) que con
// "sanctum" (Next.js). Cero lógica duplicada, solo se agrega esta segunda
// puerta de entrada autenticada por token en vez de por cookie de sesión.
// Los límites de throttle se mantienen idénticos a sus equivalentes en
// web.php: antes esta puerta no tenía ninguno, así que cualquiera con un
// token válido (o, en "compartir", sin token) podía inflar contadores de
// like/favorito/share o hacer spam de comentarios sin límite.
Route::prefix('news/{slug}')->group(function () {
    Route::get('comentarios', [CommentController::class, 'index']);
    Route::post('compartir', [ArticleInteractionController::class, 'share'])
        ->middleware('throttle:30,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('comentarios', [CommentController::class, 'store'])
            ->middleware(['throttle:20,1', 'throttle:comments-per-ip']);
        Route::post('me-gusta', [ArticleInteractionController::class, 'toggleLike'])
            ->middleware('throttle:45,1');
        Route::post('favorito', [ArticleInteractionController::class, 'toggleFavorite'])
            ->middleware('throttle:45,1');
        Route::post('reaccionar', [ArticleInteractionController::class, 'toggleReaction'])
            ->middleware('throttle:45,1');
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::patch('comentarios/{comment}', [CommentController::class, 'update'])
        ->middleware('throttle:20,1');
    Route::delete('comentarios/{comment}', [CommentController::class, 'destroy'])
        ->middleware('throttle:20,1');
    Route::post('comentarios/{comment}/me-gusta', [CommentController::class, 'toggleLike'])
        ->middleware('throttle:60,1');

    Route::get('notificaciones', [NotificationController::class, 'index'])
        ->middleware('throttle:60,1');
    Route::post('notificaciones/{id}/leida', [NotificationController::class, 'markAsRead'])
        ->middleware('throttle:60,1');
    Route::post('notificaciones/leer-todas', [NotificationController::class, 'markAllAsRead'])
        ->middleware('throttle:60,1');
    Route::delete('notificaciones/{id}', [NotificationController::class, 'destroy'])
        ->middleware('throttle:60,1');
    Route::delete('notificaciones', [NotificationController::class, 'destroyAll'])
        ->middleware('throttle:60,1');
});
