<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\AiProviderController;
use App\Http\Controllers\Admin\AiUsageController;
use App\Http\Controllers\Admin\AuthorStatsController;
use App\Http\Controllers\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DatabaseBackupController;
use App\Http\Controllers\Admin\JobRunController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\NewsArticleController;
use App\Http\Controllers\Admin\NewsReviewController;
use App\Http\Controllers\Admin\NewsSourceController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\StorageSettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Public\ArticleController;
use App\Http\Controllers\Public\ArticleInteractionController;
use App\Http\Controllers\Public\CommentController;
use App\Http\Controllers\Public\FeedController;
use App\Http\Controllers\Public\FollowController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\LegalController;
use App\Http\Controllers\Public\ManifestController;
use App\Http\Controllers\Public\NotificationController;
use App\Http\Controllers\Public\ProfileController;
use App\Http\Controllers\Public\ProfileSettingsController;
use App\Http\Controllers\Public\SearchSuggestionController;
use App\Http\Controllers\Public\SitemapController;
use App\Http\Controllers\Public\TagController;
use App\Http\Controllers\Public\TrendingController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('categoria/{category}', HomeController::class)->name('public.category');
Route::get('tendencias', TrendingController::class)->name('public.trending');
Route::get('tag/{tag:slug}', TagController::class)->name('public.tag');
Route::get('buscar/sugerencias', SearchSuggestionController::class)
    ->middleware('throttle:60,1')
    ->name('public.search.suggestions');
Route::get('noticias/{slug}', [ArticleController::class, 'show'])->name('news.show');
Route::redirect('noticia/{slug}', '/noticias/{slug}', 301);
Route::get('sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('manifest.json', ManifestController::class)->name('manifest');
Route::get('feed', [FeedController::class, 'rss'])->name('feed');

Route::get('privacidad', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('terminos', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('dmca', [LegalController::class, 'dmca'])->name('legal.dmca');
Route::get('cookies', [LegalController::class, 'cookies'])->name('legal.cookies');

Route::get('perfil/{username}', [ProfileController::class, 'show'])->name('public.profile.show');

Route::post('noticias/{slug}/compartir', [ArticleInteractionController::class, 'share'])
    ->middleware('throttle:30,1')
    ->name('public.articles.share');

Route::get('noticias/{slug}/comentarios', [CommentController::class, 'index'])
    ->name('public.comments.index');

Route::middleware(['auth'])->group(function () {
    Route::post('perfil/{username}/seguir', [FollowController::class, 'toggle'])
        ->middleware('throttle:30,1')
        ->name('public.profile.follow');
    Route::post('tag/{tag:slug}/seguir', [FollowController::class, 'toggleTag'])
        ->middleware('throttle:30,1')
        ->name('public.tag.follow');
    Route::post('categoria/{category}/seguir', [FollowController::class, 'toggleCategory'])
        ->middleware('throttle:30,1')
        ->name('public.category.follow');
    Route::get('usuarios-seguidos/sugerencias', [FollowController::class, 'followedUsersSuggestions'])
        ->middleware('throttle:60,1')
        ->name('public.followed_users.suggestions');

    Route::get('notificaciones', [NotificationController::class, 'index'])
        ->name('public.notifications.index');
    Route::post('notificaciones/{id}/leida', [NotificationController::class, 'markAsRead'])
        ->name('public.notifications.read');
    Route::post('notificaciones/leer-todas', [NotificationController::class, 'markAllAsRead'])
        ->name('public.notifications.read_all');
    Route::delete('notificaciones/{id}', [NotificationController::class, 'destroy'])
        ->name('public.notifications.destroy');
    Route::delete('notificaciones', [NotificationController::class, 'destroyAll'])
        ->name('public.notifications.destroy_all');
    Route::post('noticias/{slug}/me-gusta', [ArticleInteractionController::class, 'toggleLike'])
        ->middleware('throttle:45,1')
        ->name('public.articles.like');
    Route::post('noticias/{slug}/favorito', [ArticleInteractionController::class, 'toggleFavorite'])
        ->middleware('throttle:45,1')
        ->name('public.articles.favorite');
    Route::post('noticias/{slug}/reaccionar', [ArticleInteractionController::class, 'toggleReaction'])
        ->middleware('throttle:45,1')
        ->name('public.articles.react');

    Route::post('noticias/{slug}/comentarios', [CommentController::class, 'store'])
        ->middleware(['throttle:20,1', 'throttle:comments-per-ip'])
        ->name('public.comments.store');
    Route::patch('comentarios/{comment}', [CommentController::class, 'update'])
        ->middleware('throttle:20,1')
        ->name('public.comments.update');
    Route::delete('comentarios/{comment}', [CommentController::class, 'destroy'])
        ->name('public.comments.destroy');
    Route::post('comentarios/{comment}/me-gusta', [CommentController::class, 'toggleLike'])
        ->middleware('throttle:60,1')
        ->name('public.comments.like');

    Route::get('perfil/mi-cuenta/ajustes', [ProfileSettingsController::class, 'redirectToSelf'])
        ->name('public.profile.settings.self');
    Route::patch('perfil/mi-cuenta/ajustes', [ProfileSettingsController::class, 'updateSelf'])
        ->name('public.profile.settings.self.update');
    Route::get('perfil/{username}/ajustes', [ProfileSettingsController::class, 'edit'])->name('public.profile.settings.edit');
    Route::match(['patch', 'post'], 'perfil/{username}/ajustes', [ProfileSettingsController::class, 'update'])->name('public.profile.settings.update');
    Route::delete('perfil/{username}/ajustes', [ProfileSettingsController::class, 'destroy'])->name('public.profile.settings.destroy');
});

Route::middleware(['auth', 'verified', 'role:superadmin|admin|editor'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::middleware('role:superadmin|admin')->group(function () {
            Route::resource('users', UserController::class)
                ->only(['index', 'store', 'update', 'destroy']);
        });

        // Lo que un editor puede tocar: redactar y armar sus noticias
        // (crear, editar, ponerles imagen/audio) sin poder borrar nada ni
        // entrar a configuraciones — eso sigue reservado a superadmin más
        // abajo.
        Route::middleware('role:superadmin|admin|editor')->group(function () {
            Route::get('my-articles', [AuthorStatsController::class, 'index'])->name('my-articles.index');

            Route::resource('news-articles', NewsArticleController::class)
                ->only(['index', 'create', 'store', 'edit', 'update']);
            Route::post('news-articles/{newsArticle}/toggle-status', [NewsArticleController::class, 'toggleStatus'])
                ->name('news-articles.toggle-status');

            Route::get('media', [MediaLibraryController::class, 'index'])->name('media.index');
            Route::post('media', [MediaLibraryController::class, 'store'])->name('media.store');
            Route::post('media/from-url', [MediaLibraryController::class, 'storeFromUrl'])->name('media.store-from-url');
            Route::post('media/generate', [MediaLibraryController::class, 'generate'])
                ->middleware('throttle:ai-costly')
                ->name('media.generate');
            Route::get('media/generation-status/{newsArticle}', [MediaLibraryController::class, 'generationStatus'])
                ->name('media.generation-status');
            Route::get('media/{media}/download', [MediaLibraryController::class, 'download'])->name('media.download');

            Route::get('media-library', [MediaLibraryController::class, 'libraryIndex'])->name('media-library.index');
            Route::get('audio', [MediaLibraryController::class, 'audioList'])->name('audio.index');
            Route::post('audio', [MediaLibraryController::class, 'storeAudio'])->name('audio.store');
            Route::post('news-articles/{newsArticle}/audio', [MediaLibraryController::class, 'generateAudio'])
                ->middleware('throttle:ai-costly')
                ->name('news-articles.audio.generate');

            Route::get('jobs/runs/{runId}', [JobRunController::class, 'show'])->name('jobs.run-status');
        });

        Route::middleware('role:superadmin')->group(function () {
            // Borrar sigue siendo solo de superadmin, separado del resto de
            // acciones sobre noticias/medios que ya se abrieron arriba a
            // editor y admin.
            Route::delete('news-articles/{newsArticle}', [NewsArticleController::class, 'destroy'])
                ->name('news-articles.destroy');
            Route::delete('media/{media}', [MediaLibraryController::class, 'destroy'])->name('media.destroy');

            Route::resource('ai-providers', AiProviderController::class)
                ->only(['index', 'store', 'update', 'destroy']);
            Route::post('ai-providers/{aiProvider}/activate', [AiProviderController::class, 'activate'])
                ->name('ai-providers.activate');
            Route::post('ai-providers/{aiProvider}/toggle-auto-generate-featured-image', [AiProviderController::class, 'toggleAutoGenerateFeaturedImage'])
                ->name('ai-providers.toggle-auto-generate-featured-image');
            Route::post('ai-providers/{aiProvider}/toggle-auto-generate-narration', [AiProviderController::class, 'toggleAutoGenerateNarration'])
                ->name('ai-providers.toggle-auto-generate-narration');
            Route::post('ai-providers/{aiProvider}/test', [AiProviderController::class, 'test'])
                ->middleware('throttle:ai-costly')
                ->name('ai-providers.test');

            Route::resource('news-sources', NewsSourceController::class)
                ->only(['index', 'update', 'destroy']);
            Route::post('news-sources/{newsSource}/toggle', [NewsSourceController::class, 'toggle'])
                ->name('news-sources.toggle');
            Route::post('news-sources/activate-all', [NewsSourceController::class, 'activateAll'])
                ->name('news-sources.activate-all');
            Route::post('news-sources/deactivate-all', [NewsSourceController::class, 'deactivateAll'])
                ->name('news-sources.deactivate-all');
            Route::post('news-sources/category/{category}/activate', [NewsSourceController::class, 'activateCategory'])
                ->name('news-sources.category.activate');
            Route::post('news-sources/category/{category}/deactivate', [NewsSourceController::class, 'deactivateCategory'])
                ->name('news-sources.category.deactivate');

            Route::get('news-review', [NewsReviewController::class, 'index'])->name('news-review.index');
            Route::post('news-review/scrape', [NewsReviewController::class, 'scrape'])->name('news-review.scrape');
            Route::post('news-review/analyze', [NewsReviewController::class, 'analyze'])
                ->middleware('throttle:ai-costly')
                ->name('news-review.analyze');
            Route::post('news-review/apply-ai-verdicts', [NewsReviewController::class, 'applyAiVerdicts'])
                ->middleware('throttle:ai-costly')
                ->name('news-review.apply-ai-verdicts');
            Route::get('news-review/runs/{runId}', [NewsReviewController::class, 'runStatus'])->name('news-review.run-status');
            Route::post('news-review/toggle-auto-accept', [NewsReviewController::class, 'toggleAutoAccept'])
                ->name('news-review.toggle-auto-accept');
            Route::post('news-review/{newsCluster}/accept', [NewsReviewController::class, 'accept'])
                ->middleware('throttle:ai-costly')
                ->name('news-review.accept');
            Route::post('news-review/{newsCluster}/reject', [NewsReviewController::class, 'reject'])->name('news-review.reject');
            Route::post('news-review/{newsCluster}/restore', [NewsReviewController::class, 'restore'])->name('news-review.restore');
            Route::post('news-review/{newsCluster}/merge', [NewsReviewController::class, 'merge'])->name('news-review.merge');

            Route::get('comments', [AdminCommentController::class, 'index'])->name('comments.index');
            Route::post('comments/{comment}/approve', [AdminCommentController::class, 'approve'])->name('comments.approve');
            Route::delete('comments/{comment}', [AdminCommentController::class, 'destroy'])->name('comments.destroy');

            Route::get('backup', [DatabaseBackupController::class, 'index'])->name('backup.index');
            Route::get('backup/download', [DatabaseBackupController::class, 'download'])
                ->middleware('throttle:6,1')
                ->name('backup.download');
            Route::post('backup/restore', [DatabaseBackupController::class, 'restore'])
                ->middleware('throttle:6,1')
                ->name('backup.restore');
            Route::post('backup/remote', [DatabaseBackupController::class, 'backupNow'])
                ->middleware('throttle:6,1')
                ->name('backup.remote.store');
            Route::get('backup/remote', [DatabaseBackupController::class, 'remoteIndex'])->name('backup.remote.index');
            Route::get('backup/remote/{filename}/download', [DatabaseBackupController::class, 'downloadRemote'])
                ->middleware('throttle:6,1')
                ->name('backup.remote.download');
            Route::delete('backup/remote/{filename}', [DatabaseBackupController::class, 'destroyRemote'])->name('backup.remote.destroy');

            Route::get('storage-settings', [StorageSettingController::class, 'edit'])->name('storage-settings.edit');
            Route::put('storage-settings', [StorageSettingController::class, 'update'])->name('storage-settings.update');
            Route::post('storage-settings/test-connection', [StorageSettingController::class, 'testConnection'])
                ->middleware('throttle:10,1')
                ->name('storage-settings.test-connection');
            Route::post('storage-settings/media', [StorageSettingController::class, 'toggleMedia'])->name('storage-settings.media.toggle');
            Route::post('storage-settings/backups', [StorageSettingController::class, 'toggleBackups'])->name('storage-settings.backups.toggle');
            Route::post('storage-settings/migrate-media', [StorageSettingController::class, 'migrateMedia'])
                ->middleware('throttle:3,1')
                ->name('storage-settings.media.migrate');
            Route::post('storage-settings/rename-media', [StorageSettingController::class, 'renameMedia'])
                ->middleware('throttle:3,1')
                ->name('storage-settings.media.rename');

            Route::get('activity-log', [ActivityLogController::class, 'index'])->name('activity-log.index');
            Route::get('ai-usage', [AiUsageController::class, 'index'])->name('ai-usage.index');

            Route::get('site-settings', [SiteSettingController::class, 'edit'])->name('site-settings.edit');
            Route::put('site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');
            Route::post('site-settings/logo', [SiteSettingController::class, 'updateLogo'])->name('site-settings.logo.update');
            Route::delete('site-settings/logo', [SiteSettingController::class, 'destroyLogo'])->name('site-settings.logo.destroy');
            Route::post('site-settings/favicon', [SiteSettingController::class, 'updateFavicon'])->name('site-settings.favicon.update');
            Route::post('site-settings/og-image', [SiteSettingController::class, 'updateOgImage'])->name('site-settings.og-image.update');
            Route::post('site-settings/search-box', [SiteSettingController::class, 'updateSearchBox'])->name('site-settings.search-box.update');
            Route::post('site-settings/seo-audit', [SiteSettingController::class, 'seoAudit'])
                ->middleware('throttle:ai-costly')
                ->name('site-settings.seo-audit');
            Route::post('site-settings/seo-audit/fix', [SiteSettingController::class, 'seoAuditFix'])
                ->middleware('throttle:ai-costly')
                ->name('site-settings.seo-audit.fix');
        });
    });

Route::middleware('guest')->prefix('auth/google')->name('auth.google.')->group(function () {
    Route::get('/', [GoogleAuthController::class, 'redirect'])->name('redirect');
    Route::get('callback', [GoogleAuthController::class, 'callback'])->name('callback');
});

require __DIR__.'/settings.php';
