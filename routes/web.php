<?php

use App\Http\Controllers\Admin\AiProviderController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\NewsArticleController;
use App\Http\Controllers\Admin\NewsReviewController;
use App\Http\Controllers\Admin\NewsSourceController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Public\ArticleController;
use App\Http\Controllers\Public\FeedController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('categoria/{category}', HomeController::class)->name('public.category');
Route::get('noticias/{slug}', [ArticleController::class, 'show'])->name('news.show');
Route::get('sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('feed', [FeedController::class, 'rss'])->name('feed');

Route::middleware(['auth', 'verified', 'role:superadmin|admin|editor'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::inertia('/', 'admin/dashboard')->name('dashboard');

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
            Route::post('news-review/analyze', [NewsReviewController::class, 'analyze'])->name('news-review.analyze');
            Route::post('news-review/apply-ai-verdicts', [NewsReviewController::class, 'applyAiVerdicts'])->name('news-review.apply-ai-verdicts');
            Route::get('news-review/runs/{runId}', [NewsReviewController::class, 'runStatus'])->name('news-review.run-status');
            Route::post('news-review/{newsCluster}/accept', [NewsReviewController::class, 'accept'])->name('news-review.accept');
            Route::post('news-review/{newsCluster}/reject', [NewsReviewController::class, 'reject'])->name('news-review.reject');

            Route::resource('news-articles', NewsArticleController::class)
                ->only(['index', 'edit', 'update', 'destroy']);
            Route::post('news-articles/{newsArticle}/toggle-status', [NewsArticleController::class, 'toggleStatus'])
                ->name('news-articles.toggle-status');

            Route::get('media', [MediaLibraryController::class, 'index'])->name('media.index');
            Route::post('media', [MediaLibraryController::class, 'store'])->name('media.store');
            Route::post('media/from-url', [MediaLibraryController::class, 'storeFromUrl'])->name('media.store-from-url');
            Route::post('media/generate', [MediaLibraryController::class, 'generate'])->name('media.generate');
            Route::delete('media/{media}', [MediaLibraryController::class, 'destroy'])->name('media.destroy');

            Route::get('media-library', [MediaLibraryController::class, 'libraryIndex'])->name('media-library.index');
            Route::get('audio', [MediaLibraryController::class, 'audioList'])->name('audio.index');
            Route::post('news-articles/{newsArticle}/audio', [MediaLibraryController::class, 'generateAudio'])->name('news-articles.audio.generate');
        });
    });

Route::middleware('guest')->prefix('auth/google')->name('auth.google.')->group(function () {
    Route::get('/', [GoogleAuthController::class, 'redirect'])->name('redirect');
    Route::get('callback', [GoogleAuthController::class, 'callback'])->name('callback');
});

require __DIR__.'/settings.php';
