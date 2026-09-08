<?php

use App\Http\Controllers\Admin\AiProviderController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

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
        });
    });

Route::middleware('guest')->prefix('auth/google')->name('auth.google.')->group(function () {
    Route::get('/', [GoogleAuthController::class, 'redirect'])->name('redirect');
    Route::get('callback', [GoogleAuthController::class, 'callback'])->name('callback');
});

require __DIR__.'/settings.php';
