<?php

use App\Services\Admin\DatabaseBackupService;
use Illuminate\Support\Facades\DB;

/**
 * Este servicio genera/restaura SQL específico de MySQL (`show create table`,
 * `PDO::MYSQL_ATTR_MULTI_STATEMENTS`), así que estos tests usan la conexión
 * `mysql` real contra una base temporal, no el `sqlite` en memoria del resto
 * de la suite. Se saltan solos si no hay un MySQL alcanzable.
 */
beforeEach(function () {
    // phpunit.xml fuerza DB_DATABASE=:memory: (para el sqlite en memoria del
    // resto de la suite), pero esa misma env var también contamina la
    // conexión `mysql` de config/database.php. Se limpia antes de probar
    // conectividad, si no cualquier entorno con mysql real se saltearía.
    config(['database.connections.mysql.database' => null]);
    DB::purge('mysql');

    try {
        DB::connection('mysql')->getPdo();
    } catch (Throwable) {
        $this->markTestSkipped('No hay una conexión mysql disponible en este entorno.');
    }

    $this->testDatabase = 'kawaiinews_backup_test_'.uniqid();

    DB::connection('mysql')->statement("CREATE DATABASE `{$this->testDatabase}`");

    config(['database.default' => 'mysql']);
    config(['database.connections.mysql.database' => $this->testDatabase]);
    DB::purge('mysql');

    DB::statement('create table widgets (id bigint unsigned not null auto_increment primary key, name varchar(255) not null, note text null)');
    DB::table('widgets')->insert([
        ['name' => "Nombre con 'comillas' y ; punto y coma", 'note' => null],
        ['name' => 'Otro widget', 'note' => "Texto con\nsalto de línea; y más texto"],
    ]);
});

afterEach(function () {
    if (isset($this->testDatabase)) {
        DB::connection('mysql')->statement("DROP DATABASE IF EXISTS `{$this->testDatabase}`");
    }

    config(['database.default' => 'sqlite']);
    DB::purge('mysql');
});

test('it exports a compressed backup that can be decompressed back into valid sql', function () {
    $service = app(DatabaseBackupService::class);

    $gz = $service->exportCompressed();
    $sql = gzdecode($gz);

    expect($sql)->toContain('CREATE TABLE `widgets`')
        ->toContain('INSERT INTO `widgets`')
        ->toContain('Nombre con');
});

test('it restores a backup, correctly handling values containing semicolons and quotes', function () {
    $service = app(DatabaseBackupService::class);
    $gz = $service->exportCompressed();

    DB::table('widgets')->truncate();
    expect(DB::table('widgets')->count())->toBe(0);

    $service->importCompressed($gz);

    expect(DB::table('widgets')->count())->toBe(2);
    expect(DB::table('widgets')->where('name', "Nombre con 'comillas' y ; punto y coma")->exists())->toBeTrue();
    expect(DB::table('widgets')->where('note', "Texto con\nsalto de línea; y más texto")->exists())->toBeTrue();
});

test('it skips transient tables like sessions and cache from the backup', function () {
    DB::statement('create table if not exists sessions (id varchar(255) primary key, payload text)');
    DB::table('sessions')->insert(['id' => 'abc', 'payload' => 'x']);

    $service = app(DatabaseBackupService::class);
    $sql = gzdecode($service->exportCompressed());

    expect($sql)->not->toContain('`sessions`');
});

test('importing an invalid file throws instead of silently doing nothing', function () {
    $service = app(DatabaseBackupService::class);

    expect(fn () => $service->importCompressed('esto no es un gzip'))
        ->toThrow(RuntimeException::class);
});
