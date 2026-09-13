<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RestoreDatabaseRequest;
use App\Models\StorageSetting;
use App\Services\Admin\DatabaseBackupService;
use App\Support\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Throwable;

class DatabaseBackupController extends Controller
{
    public function __construct(private readonly DatabaseBackupService $databaseBackupService) {}

    public function index(): InertiaResponse
    {
        return Inertia::render('admin/backup/index', [
            'remoteConfigured' => StorageSetting::current()->isConfigured(),
            'remoteActiveForBackups' => StorageSetting::current()->active_for_backups,
        ]);
    }

    public function download(): HttpResponse
    {
        $filename = 'kawaiinews-backup-'.now()->format('Y-m-d_His').'.sql.gz';
        $contents = $this->databaseBackupService->exportCompressed();

        try {
            $this->databaseBackupService->uploadToRemote($filename, $contents);
        } catch (Throwable $exception) {
            // No frenamos la descarga al navegador por un fallo al subir
            // la copia remota — el admin igual se lleva su backup.
            Log::warning('No se pudo subir el backup a almacenamiento remoto: '.$exception->getMessage());
        }

        return response($contents, 200, [
            'Content-Type' => 'application/gzip',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Genera un backup y lo sube directo a Wasabi/S3, sin bajarlo al
     * navegador — para armar uno "de guardia" sin ocupar ancho de banda
     * local.
     */
    public function backupNow(): RedirectResponse
    {
        $settings = StorageSetting::current();

        if (! $settings->active_for_backups) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Activá "Backups" en Configuración de almacenamiento primero.']);

            return back();
        }

        $filename = 'kawaiinews-backup-'.now()->format('Y-m-d_His').'.sql.gz';
        $this->databaseBackupService->uploadToRemote($filename, $this->databaseBackupService->exportCompressed());

        ActivityLogger::log('backup.uploaded_to_remote', description: "Subió un backup a almacenamiento remoto ({$filename})");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Backup subido a almacenamiento remoto.']);

        return back();
    }

    public function remoteIndex(): JsonResponse
    {
        return response()->json(['backups' => $this->databaseBackupService->listRemote()]);
    }

    public function downloadRemote(string $filename): HttpResponse
    {
        $filename = basename($filename);

        return response($this->databaseBackupService->downloadRemote($filename), 200, [
            'Content-Type' => 'application/gzip',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function destroyRemote(string $filename): RedirectResponse
    {
        $this->databaseBackupService->deleteRemote(basename($filename));

        ActivityLogger::log('backup.remote_deleted', description: "Eliminó un backup remoto ({$filename})");

        return back();
    }

    public function restore(RestoreDatabaseRequest $request): RedirectResponse
    {
        $this->databaseBackupService->importCompressed(
            file_get_contents($request->file('backup')->getRealPath())
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Backup restaurado correctamente.')]);

        return to_route('admin.backup.index');
    }
}
