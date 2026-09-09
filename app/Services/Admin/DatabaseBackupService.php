<?php

namespace App\Services\Admin;

use Illuminate\Support\Facades\DB;
use PDO;
use Pdo\Mysql;
use RuntimeException;

class DatabaseBackupService
{
    private const SKIP_TABLES = [
        'cache',
        'cache_locks',
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'password_reset_tokens',
    ];

    private const CHUNK_SIZE = 200;

    public function exportCompressed(): string
    {
        return gzencode($this->buildSql(), 9);
    }

    public function importCompressed(string $gzContent): void
    {
        $sql = @gzdecode($gzContent);

        if ($sql === false || trim($sql) === '') {
            throw new RuntimeException('El archivo no es un backup .sql.gz válido.');
        }

        $config = config('database.connections.'.config('database.default'));

        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";

        $multiStatementsAttribute = class_exists(Mysql::class)
            ? Mysql::ATTR_MULTI_STATEMENTS
            : PDO::MYSQL_ATTR_MULTI_STATEMENTS;

        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            $multiStatementsAttribute => true,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        $pdo->exec($sql);
    }

    public function buildSql(): string
    {
        $database = config('database.connections.'.config('database.default').'.database');
        $tables = collect(DB::select('show tables'))
            ->map(fn ($row) => array_values((array) $row)[0])
            ->reject(fn (string $table) => in_array($table, self::SKIP_TABLES, true))
            ->values();

        $sql = "-- KawaiiNews backup: {$database} — ".now()->toDateTimeString()."\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            $sql .= $this->dumpTable($table);
        }

        return $sql."SET FOREIGN_KEY_CHECKS=1;\n";
    }

    private function dumpTable(string $table): string
    {
        $createRow = (array) DB::selectOne("show create table `{$table}`");
        $createSql = $createRow['Create Table'] ?? reset($createRow);

        $sql = "DROP TABLE IF EXISTS `{$table}`;\n{$createSql};\n\n";

        $rows = DB::table($table)->get();

        if ($rows->isEmpty()) {
            return $sql;
        }

        $columns = array_keys((array) $rows->first());
        $columnList = '`'.implode('`, `', $columns).'`';

        foreach ($rows->chunk(self::CHUNK_SIZE) as $chunk) {
            $values = $chunk
                ->map(fn ($row) => '('.implode(', ', array_map($this->quote(...), (array) $row)).')')
                ->implode(",\n");

            $sql .= "INSERT INTO `{$table}` ({$columnList}) VALUES\n{$values};\n\n";
        }

        return $sql;
    }

    private function quote(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return DB::connection()->getPdo()->quote((string) $value);
    }
}
