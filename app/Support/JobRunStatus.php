<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Sigue el estado de una operación asincrónica disparada a una cola
 * (scraping, análisis con IA, aplicar veredictos) para que el frontend
 * pueda hacer polling en vez de esperar la respuesta HTTP colgada.
 *
 * @phpstan-type RunStatus array{status: 'queued'|'done'|'failed', result: mixed, error: string|null}
 */
class JobRunStatus
{
    private const TTL_MINUTES = 15;

    public static function start(): string
    {
        $runId = (string) Str::uuid();

        self::put($runId, ['status' => 'queued', 'result' => null, 'error' => null]);

        return $runId;
    }

    public static function complete(string $runId, mixed $result): void
    {
        self::put($runId, ['status' => 'done', 'result' => $result, 'error' => null]);
    }

    public static function fail(string $runId, string $message): void
    {
        self::put($runId, ['status' => 'failed', 'result' => null, 'error' => $message]);
    }

    /**
     * @return array{status: string, result: mixed, error: string|null}
     */
    public static function get(string $runId): array
    {
        return Cache::get(self::key($runId), [
            'status' => 'unknown',
            'result' => null,
            'error' => 'No se encontró esa operación (puede haber expirado).',
        ]);
    }

    /**
     * @param  array{status: string, result: mixed, error: string|null}  $payload
     */
    private static function put(string $runId, array $payload): void
    {
        Cache::put(self::key($runId), $payload, now()->addMinutes(self::TTL_MINUTES));
    }

    private static function key(string $runId): string
    {
        return "job-run-status:{$runId}";
    }
}
