<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\RadioQueueItemResource;
use App\Services\Admin\RadioService;
use Illuminate\Http\JsonResponse;

/**
 * La cola ya viene armada de antemano (ver RadioService::buildQueue(),
 * corrida por radio:build-queue) — este endpoint solo la sirve tal cual,
 * sin llamar a ningún proveedor de IA ni importar cuántos oyentes pidan
 * esto al mismo tiempo.
 */
class RadioController extends Controller
{
    public function __invoke(RadioService $radioService): JsonResponse
    {
        $queueCollection = $radioService->currentQueue();
        $queue = RadioQueueItemResource::collection($queueCollection)->resolve();

        $totalDuration = 0;
        $durations = [];
        foreach ($queue as $item) {
            $duration = (int) ($item['duration_seconds'] ?? 0);
            if ($duration <= 0) {
                $duration = $item['type'] === 'music' ? 180 : 90;
            }
            $durations[] = $duration;
            $totalDuration += $duration;
        }

        $currentTrackIndex = 0;
        $currentTrackOffset = 0;

        // El punto de referencia es cuándo arrancó ESTA cola (no la hora
        // Unix cruda) — así, apenas se reconstruye la cola (cada 4h o a
        // mano desde el panel), todos los oyentes arrancan de nuevo desde
        // el principio, en vez de "caer" en un punto en el medio al azar.
        // Igual sigue siendo un cálculo puro a partir de la hora del
        // servidor, sin guardar estado por oyente: dos personas que
        // consultan este endpoint en el mismo segundo reciben exactamente
        // el mismo índice y el mismo offset, se hayan conectado recién o
        // hace rato.
        if ($totalDuration > 0 && count($queue) > 0) {
            $elapsedSinceStart = abs(now()->diffInSeconds($radioService->queueStartedAt()));
            $cycleOffset = $elapsedSinceStart % $totalDuration;
            $accumulated = 0;

            foreach ($durations as $index => $dur) {
                if ($cycleOffset < ($accumulated + $dur)) {
                    $currentTrackIndex = $index;
                    $currentTrackOffset = $cycleOffset - $accumulated;
                    break;
                }
                $accumulated += $dur;
            }
        }

        return response()->json([
            'queue' => $queue,
            'server_time' => time(),
            'queue_started_at' => $radioService->queueStartedAt()->timestamp,
            'current_track_index' => $currentTrackIndex,
            'current_track_offset' => $currentTrackOffset,
            'total_duration' => $totalDuration,
        ]);
    }
}
