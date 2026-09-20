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

        if ($totalDuration > 0 && count($queue) > 0) {
            $nowTimestamp = time();
            $cycleOffset = $nowTimestamp % $totalDuration;
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
            'current_track_index' => $currentTrackIndex,
            'current_track_offset' => $currentTrackOffset,
            'total_duration' => $totalDuration,
        ]);
    }
}
