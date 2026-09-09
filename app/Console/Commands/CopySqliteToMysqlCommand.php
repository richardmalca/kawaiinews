<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migración única (no forma parte del `schedule` ni de un deploy normal):
 * copia los datos reales de un `database.sqlite` viejo a la conexión mysql
 * ya configurada en `.env`, preservando los IDs originales (necesario para
 * no romper las relaciones: news_articles.author_id, media.news_article_id,
 * etc.). El archivo `.sqlite` nunca se toca ni se borra, queda como
 * respaldo. Requiere correr `php artisan migrate` contra mysql antes.
 */
class CopySqliteToMysqlCommand extends Command
{
    protected $signature = 'db:copy-sqlite-to-mysql
        {--sqlite-path= : Ruta al archivo .sqlite (default: database/database.sqlite)}
        {--dry-run : Solo mostrar qué se copiaría, sin escribir nada}';

    protected $description = 'Copia los datos de database.sqlite a la conexión mysql configurada, preservando IDs';

    private const SKIP_TABLES = [
        'migrations',
        'cache',
        'cache_locks',
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'password_reset_tokens',
    ];

    private const CHUNK_SIZE = 500;

    public function handle(): int
    {
        $sqlitePath = $this->option('sqlite-path') ?: database_path('database.sqlite');

        if (! file_exists($sqlitePath)) {
            $this->error("No se encontró el archivo SQLite en: {$sqlitePath}");

            return self::FAILURE;
        }

        if (config('database.default') !== 'mysql') {
            $this->error('DB_CONNECTION no es "mysql" en este momento. Configurá tu .env para usar mysql antes de correr esto.');

            return self::FAILURE;
        }

        config(['database.connections.sqlite.database' => $sqlitePath]);
        DB::purge('sqlite');

        $tables = collect(DB::connection('sqlite')->select(
            "select name from sqlite_master where type = 'table' and name not like 'sqlite_%'"
        ))
            ->pluck('name')
            ->reject(fn (string $table) => in_array($table, self::SKIP_TABLES, true))
            ->values();

        if ($tables->isEmpty()) {
            $this->warn('No hay tablas para copiar.');

            return self::SUCCESS;
        }

        $mysqlTables = collect(DB::connection('mysql')->select('show tables'))
            ->map(fn ($row) => array_values((array) $row)[0]);

        $missing = $tables->diff($mysqlTables);

        if ($missing->isNotEmpty()) {
            $this->error('Faltan estas tablas en mysql (corré `php artisan migrate` primero): '.$missing->implode(', '));

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');

        if (! $dryRun) {
            DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
        }

        try {
            foreach ($tables as $table) {
                $this->copyTable($table, $dryRun);
            }
        } finally {
            if (! $dryRun) {
                DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');
            }
        }

        $this->newLine();
        $this->info($dryRun ? 'Dry-run completo, no se escribió nada.' : 'Copia completa.');

        return self::SUCCESS;
    }

    private function copyTable(string $table, bool $dryRun): void
    {
        $total = DB::connection('sqlite')->table($table)->count();

        if ($total === 0) {
            $this->line("· {$table}: vacía en sqlite, se salta");

            return;
        }

        $existing = DB::connection('mysql')->table($table)->count();

        if ($existing > 0) {
            $this->warn("· {$table}: ya tiene {$existing} fila(s) en mysql, se salta para no duplicar");

            return;
        }

        $this->line("· {$table}: copiando {$total} fila(s)...");

        if ($dryRun) {
            return;
        }

        $rows = DB::connection('sqlite')->table($table)->get()
            ->map(fn ($row) => (array) $row);

        foreach ($rows->chunk(self::CHUNK_SIZE) as $chunk) {
            DB::connection('mysql')->table($table)->insert($chunk->all());
        }

        $this->resetAutoIncrement($table);
    }

    private function resetAutoIncrement(string $table): void
    {
        if (! Schema::connection('mysql')->hasColumn($table, 'id')) {
            return;
        }

        $max = DB::connection('mysql')->table($table)->max('id');

        if ($max === null) {
            return;
        }

        DB::connection('mysql')->statement("ALTER TABLE `{$table}` AUTO_INCREMENT = ".((int) $max + 1));
    }
}
