<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRadioTrackRequest;
use App\Http\Resources\Admin\RadioQueueItemResource;
use App\Http\Resources\Admin\RadioTrackResource;
use App\Jobs\BuildRadioQueueJob;
use App\Models\RadioTrack;
use App\Services\Admin\RadioService;
use App\Support\JobRunStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class RadioController extends Controller
{
    public function __construct(private readonly RadioService $radioService) {}

    public function index(): Response
    {
        return Inertia::render('admin/radio/index', [
            'tracks' => RadioTrackResource::collection(RadioTrack::latest()->get())->resolve(),
            'queue' => RadioQueueItemResource::collection($this->radioService->currentQueue())->resolve(),
        ]);
    }

    public function store(StoreRadioTrackRequest $request): JsonResponse
    {
        $track = $this->radioService->addTrack(
            $request->file('file'),
            $request->validated('title'),
            $request->validated('artist'),
        );

        return response()->json((new RadioTrackResource($track))->resolve());
    }

    public function destroy(RadioTrack $radioTrack): JsonResponse
    {
        $this->radioService->removeTrack($radioTrack);

        return response()->json(['deleted' => true]);
    }

    /**
     * Reconstruir la cola puede tardar (llamadas de IA en serie, una por
     * noticia nueva) — si el admin le da varias veces mientras la
     * programada (routes/console.php) ya está corriendo, no encolamos
     * otra: se engancha al mismo run_id. Mismo criterio que generar
     * imagen/audio en MediaLibraryService.
     */
    public function rebuildQueue(): JsonResponse
    {
        $existingRunId = Cache::get('radio:queue-rebuild-lock');

        if ($existingRunId) {
            return response()->json(['run_id' => $existingRunId, 'already_running' => true]);
        }

        $runId = JobRunStatus::start();
        Cache::put('radio:queue-rebuild-lock', $runId, now()->addMinutes(6));

        BuildRadioQueueJob::dispatch($runId);

        return response()->json(['run_id' => $runId, 'already_running' => false]);
    }
}
