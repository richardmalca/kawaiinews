<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RestoreDatabaseRequest;
use App\Services\Admin\DatabaseBackupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DatabaseBackupController extends Controller
{
    public function __construct(private readonly DatabaseBackupService $databaseBackupService) {}

    public function index(): InertiaResponse
    {
        return Inertia::render('admin/backup/index');
    }

    public function download(): HttpResponse
    {
        $filename = 'kawaiinews-backup-'.now()->format('Y-m-d_His').'.sql.gz';

        return response($this->databaseBackupService->exportCompressed(), 200, [
            'Content-Type' => 'application/gzip',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
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
