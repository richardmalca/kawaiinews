<?php

namespace App\Console\Commands;

use App\Services\Admin\DatabaseBackupService;
use Illuminate\Console\Command;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'db:backup {--path= : Ruta destino del .sql.gz (default: storage/app/backups/backup-<fecha>.sql.gz)}';

    protected $description = 'Genera un backup comprimido (.sql.gz) de la base de datos';

    public function handle(DatabaseBackupService $databaseBackupService): int
    {
        $path = $this->option('path') ?: storage_path('app/backups/backup-'.now()->format('Y-m-d_His').'.sql.gz');

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, $databaseBackupService->exportCompressed());

        $this->info('Backup generado en: '.$path.' ('.round(filesize($path) / 1024, 1).' KB)');

        return self::SUCCESS;
    }
}
