<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateStorageSettingRequest;
use App\Jobs\MigrateMediaStorageJob;
use App\Models\StorageSetting;
use App\Services\Admin\MediaLibraryService;
use App\Services\Admin\StorageSettingService;
use App\Support\ActivityLogger;
use App\Support\JobRunStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StorageSettingController extends Controller
{
    public function __construct(
        private readonly StorageSettingService $storageSettingService,
        private readonly MediaLibraryService $mediaLibraryService,
    ) {}

    public function edit(): Response
    {
        $settings = StorageSetting::current();

        return Inertia::render('admin/storage-settings/index', [
            'settings' => [
                'access_key' => $settings->access_key,
                'has_secret_key' => filled($settings->secret_key),
                'bucket' => $settings->bucket,
                'region' => $settings->region,
                'endpoint' => $settings->endpoint,
                'use_path_style_endpoint' => $settings->use_path_style_endpoint,
                'public_url' => $settings->public_url,
                'public_url_preview' => $settings->publicUrlBase(),
                'is_configured' => $settings->isConfigured(),
                'active_for_media' => $settings->active_for_media,
                'active_for_backups' => $settings->active_for_backups,
                'last_verified_at' => $settings->last_verified_at?->diffForHumans(),
            ],
            'mediaLocation' => $this->mediaLibraryService->countByLocation(),
        ]);
    }

    public function update(UpdateStorageSettingRequest $request): RedirectResponse
    {
        $this->storageSettingService->update(StorageSetting::current(), $request->validated());

        ActivityLogger::log('storage_settings.updated', description: 'Actualizó las credenciales de almacenamiento (Wasabi/S3)');

        return back();
    }

    public function testConnection(): JsonResponse
    {
        return response()->json($this->storageSettingService->testConnection(StorageSetting::current()));
    }

    public function toggleMedia(Request $request): RedirectResponse
    {
        $request->validate(['enabled' => ['required', 'boolean']]);

        $this->storageSettingService->setActiveForMedia(StorageSetting::current(), $request->boolean('enabled'));

        ActivityLogger::log(
            'storage_settings.media_toggled',
            description: $request->boolean('enabled') ? 'Activó Wasabi/S3 para medios' : 'Desactivó Wasabi/S3 para medios',
        );

        return back();
    }

    public function migrateMedia(Request $request): JsonResponse
    {
        $data = $request->validate([
            'direction' => ['required', Rule::in(['remote', 'local'])],
        ]);

        $runId = JobRunStatus::start();

        MigrateMediaStorageJob::dispatch($runId, $data['direction']);

        ActivityLogger::log(
            'storage_settings.media_migration_started',
            description: $data['direction'] === 'remote'
                ? 'Empezó a pasar los archivos guardados a Wasabi/S3'
                : 'Empezó a traer los archivos de vuelta a este servidor',
        );

        return response()->json(['run_id' => $runId]);
    }

    public function toggleBackups(Request $request): RedirectResponse
    {
        $request->validate(['enabled' => ['required', 'boolean']]);

        $this->storageSettingService->setActiveForBackups(StorageSetting::current(), $request->boolean('enabled'));

        ActivityLogger::log(
            'storage_settings.backups_toggled',
            description: $request->boolean('enabled') ? 'Activó Wasabi/S3 para backups' : 'Desactivó Wasabi/S3 para backups',
        );

        return back();
    }
}
