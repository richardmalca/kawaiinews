<?php

namespace App\Jobs;

use App\Services\Admin\RadioService;
use App\Support\FriendlyAiError;
use App\Support\JobRunStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Puede tardar (hasta 8 llamadas de IA seguidas, una por noticia nueva sin
 * frase del DJ todavía) — se encola en vez de bloquear la request, igual
 * que el resto de las operaciones que le pegan a un proveedor de IA.
 */
class BuildRadioQueueJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public int $tries = 1;

    public function __construct(public readonly string $runId) {}

    public function handle(RadioService $radioService): void
    {
        try {
            $result = $radioService->buildQueue();

            JobRunStatus::complete($this->runId, $result);
        } catch (Throwable $exception) {
            JobRunStatus::fail($this->runId, FriendlyAiError::forException($exception));
        } finally {
            Cache::forget('radio:queue-rebuild-lock');
        }
    }

    /**
     * Cubre el caso en que el job muere antes de llegar a handle() (ej. el
     * worker se reinicia a mitad de camino) — sin esto el candado se queda
     * trabado para siempre.
     */
    public function failed(Throwable $exception): void
    {
        JobRunStatus::fail($this->runId, FriendlyAiError::forException($exception));

        Cache::forget('radio:queue-rebuild-lock');
    }
}
