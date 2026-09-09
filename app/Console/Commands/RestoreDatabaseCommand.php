<?php

namespace App\Console\Commands;

use App\Services\Admin\DatabaseBackupService;
use Illuminate\Console\Command;

class RestoreDatabaseCommand extends Command
{
    protected $signature = 'db:restore {path : Ruta al archivo .sql.gz} {--force : No pedir confirmación}';

    protected $description = 'Restaura la base de datos desde un backup .sql.gz, sobrescribiendo las tablas actuales';

    public function handle(DatabaseBackupService $databaseBackupService): int
    {
        $path = $this->argument('path');

        if (! file_exists($path)) {
            $this->error("No se encontró el archivo: {$path}");

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm('Esto va a SOBREESCRIBIR las tablas actuales con lo que hay en el backup. ¿Continuar?')) {
            return self::FAILURE;
        }

        $databaseBackupService->importCompressed(file_get_contents($path));

        $this->info('Restauración completa.');

        return self::SUCCESS;
    }
}
