<?php

use App\Http\Controllers\Admin\AiProviderController;
use App\Http\Controllers\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DatabaseBackupController;
use App\Http\Controllers\Admin\JobRunController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\NewsArticleController;
use App\Http\Controllers\Admin\NewsReviewController;
use App\Http\Controllers\Admin\NewsSourceController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Public\ArticleController;
use App\Http\Controllers\Public\ArticleInteractionController;
use App\Http\Controllers\Public\CommentController;
use App\Http\Controllers\Public\FeedController;
use App\Http\Controllers\Public\FollowController;
use App\Http\Controllers\Public\HomeController;
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
Route::get('sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('feed', [FeedController::class, 'rss'])->name('feed');

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

    Route::get('notificaciones', [NotificationController::class, 'index'])
        ->name('public.notifications.index');
    Route::post('notificaciones/{id}/leida', [NotificationController::class, 'markAsRead'])
        ->name('public.notifications.read');
    Route::post('notificaciones/leer-todas', [NotificationController::class, 'markAllAsRead'])
        ->name('public.notifications.read_all');
    Route::post('noticias/{slug}/me-gusta', [ArticleInteractionController::class, 'toggleLike'])
        ->middleware('throttle:45,1')
        ->name('public.articles.like');
    Route::post('noticias/{slug}/favorito', [ArticleInteractionController::class, 'toggleFavorite'])
        ->middleware('throttle:45,1')
        ->name('public.articles.favorite');

    Route::post('noticias/{slug}/comentarios', [CommentController::class, 'store'])
        ->middleware('throttle:20,1')
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

        Route::middleware('role:superadmin')->group(function () {
            Route::resource('ai-providers', AiProviderController::class)
                ->only(['index', 'store', 'update', 'destroy']);
            Route::post('ai-providers/{aiProvider}/activate', [AiProviderController::class, 'activate'])
                ->name('ai-providers.activate');
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
            Route::post('news-review/{newsCluster}/accept', [NewsReviewController::class, 'accept'])
                ->middleware('throttle:ai-costly')
                ->name('news-review.accept');
            Route::post('news-review/{newsCluster}/reject', [NewsReviewController::class, 'reject'])->name('news-review.reject');

            Route::resource('news-articles', NewsArticleController::class)
                ->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
            Route::post('news-articles/{newsArticle}/toggle-status', [NewsArticleController::class, 'toggleStatus'])
                ->name('news-articles.toggle-status');

            Route::get('comments', [AdminCommentController::class, 'index'])->name('comments.index');
            Route::delete('comments/{comment}', [AdminCommentController::class, 'destroy'])->name('comments.destroy');

            Route::get('media', [MediaLibraryController::class, 'index'])->name('media.index');
            Route::post('media', [MediaLibraryController::class, 'store'])->name('media.store');
            Route::post('media/from-url', [MediaLibraryController::class, 'storeFromUrl'])->name('media.store-from-url');
            Route::post('media/generate', [MediaLibraryController::class, 'generate'])
                ->middleware('throttle:ai-costly')
                ->name('media.generate');
            Route::get('media/generation-status/{newsArticle}', [MediaLibraryController::class, 'generationStatus'])
                ->name('media.generation-status');
            Route::get('media/{media}/download', [MediaLibraryController::class, 'download'])->name('media.download');
            Route::delete('media/{media}', [MediaLibraryController::class, 'destroy'])->name('media.destroy');

            Route::get('media-library', [MediaLibraryController::class, 'libraryIndex'])->name('media-library.index');
            Route::get('audio', [MediaLibraryController::class, 'audioList'])->name('audio.index');
            Route::post('audio', [MediaLibraryController::class, 'storeAudio'])->name('audio.store');
            Route::post('news-articles/{newsArticle}/audio', [MediaLibraryController::class, 'generateAudio'])
                ->middleware('throttle:ai-costly')
                ->name('news-articles.audio.generate');

            Route::get('jobs/runs/{runId}', [JobRunController::class, 'show'])->name('jobs.run-status');

            Route::get('backup', [DatabaseBackupController::class, 'index'])->name('backup.index');
            Route::get('backup/download', [DatabaseBackupController::class, 'download'])
                ->middleware('throttle:6,1')
                ->name('backup.download');
            Route::post('backup/restore', [DatabaseBackupController::class, 'restore'])
                ->middleware('throttle:6,1')
                ->name('backup.restore');
        });
    });

Route::middleware('guest')->prefix('auth/google')->name('auth.google.')->group(function () {
    Route::get('/', [GoogleAuthController::class, 'redirect'])->name('redirect');
    Route::get('callback', [GoogleAuthController::class, 'callback'])->name('callback');
});

require __DIR__.'/settings.php';
