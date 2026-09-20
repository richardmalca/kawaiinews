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
        return response()->json([
            'queue' => RadioQueueItemResource::collection($radioService->currentQueue())->resolve(),
        ]);
    }
}
