# Backup y restauración de la base de datos

No depende de `mysqldump`/`mysql` (no siempre están en el PATH, ej. Laragon en Windows) — es un dump nativo en PHP, portable entre entornos.

## `App\Services\Admin\DatabaseBackupService`

- `exportCompressed(): string` — arma un `.sql` con `DROP TABLE IF EXISTS` + `CREATE TABLE` (via `SHOW CREATE TABLE`) + `INSERT INTO` por cada fila de cada tabla, y lo comprime con `gzencode()`. Salta tablas transitorias (`cache`, `cache_locks`, `sessions`, `jobs`, `job_batches`, `failed_jobs`, `password_reset_tokens`) — todo lo demás, incluida `migrations`, se incluye.
- `importCompressed(string $gz): void` — descomprime y ejecuta el SQL completo en una sola llamada `PDO::exec()`, con `PDO::MYSQL_ATTR_MULTI_STATEMENTS` (o su equivalente `Pdo\Mysql::ATTR_MULTI_STATEMENTS` en PHP 8.4+, sin warning de deprecación) habilitado. Se eligió esto en vez de partir el SQL por `;` porque el contenido real (cuerpos de noticias en HTML) puede tener punto y coma dentro de un valor de texto — partir el string a mano rompería el import silenciosamente. Dejar que MySQL parsee el SQL real evita ese problema.
- Los valores se escapan con `PDO::quote()` fila por fila (no hay valores binarios en este proyecto, todo texto/número/fecha).

## Comandos artisan

```
php artisan db:backup [--path=]        # genera un .sql.gz (default: storage/app/backups/)
php artisan db:restore {path} [--force] # restaura desde un .sql.gz, pide confirmación salvo --force
```

## Panel admin (`/admin/backup`, solo superadmin)

- `GET admin/backup` — página con botón de descarga y formulario de restauración.
- `GET admin/backup/download` — genera y descarga el `.sql.gz` al vuelo (no lo guarda en disco).
- `POST admin/backup/restore` — sube un archivo (`multipart/form-data`, máx 50MB) y **pide la contraseña actual** para confirmar, igual que "Eliminar cuenta" — es una operación destructiva (sobreescribe todas las tablas).

Ambas rutas tienen `throttle:6,1` (no `ai-costly`, esto no le pega a ningún proveedor de IA, pero sigue siendo una operación pesada que no debería poder spamearse).

## Tests

- `tests/Feature/Admin/DatabaseBackupServiceTest.php` — usa la conexión `mysql` real contra una base temporal (se crea y se borra en el test), porque el servicio genera SQL específico de MySQL que no corre contra el `sqlite` en memoria del resto de la suite. **Se salta solo** si no hay un MySQL alcanzable en el entorno. Cubre: export con contenido válido, restore preservando valores con comillas/saltos de línea/punto y coma, que las tablas transitorias no se incluyan, y que un archivo inválido tire una excepción en vez de fallar en silencio.
- `tests/Feature/Admin/DatabaseBackupControllerTest.php` — autorización (solo superadmin), que restaurar pida la contraseña correcta, usando un mock del servicio (no toca MySQL real acá).

## Verificado en vivo

Se probó el flujo completo contra los datos reales del usuario: export de la base `kawaiinews` (222 clusters, 249 scraped_items, etc.) → restore en una base `kawaiinews_backup_test_*` temporal → conteos idénticos, sin pérdida de datos. La base de prueba y el archivo se borraron después.
