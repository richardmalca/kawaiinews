<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAiProviderRequest;
use App\Http\Requests\Admin\UpdateAiProviderRequest;
use App\Http\Resources\AiProviderResource;
use App\Models\AiProvider;
use App\Services\AiProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AiProviderController extends Controller
{
    public function __construct(private readonly AiProviderService $aiProviderService) {}

    public function index(): Response
    {
        return Inertia::render('admin/ai-providers/index', [
            'providers' => AiProviderResource::collection(AiProvider::orderBy('label')->get())->resolve(),
            'summary' => $this->aiProviderService->summary(),
            'catalog' => $this->aiProviderService->catalog(),
        ]);
    }

    public function store(StoreAiProviderRequest $request): RedirectResponse
    {
        $this->aiProviderService->createFromCatalog($request->validated());

        return to_route('admin.ai-providers.index');
    }

    public function update(UpdateAiProviderRequest $request, AiProvider $aiProvider): RedirectResponse
    {
        $this->aiProviderService->save($aiProvider, $request->validated());

        return to_route('admin.ai-providers.index');
    }

    public function activate(AiProvider $aiProvider): RedirectResponse
    {
        $this->aiProviderService->activate($aiProvider);

        return to_route('admin.ai-providers.index');
    }

    public function destroy(AiProvider $aiProvider): RedirectResponse
    {
        $this->aiProviderService->delete($aiProvider);

        return to_route('admin.ai-providers.index');
    }

    public function test(AiProvider $aiProvider): JsonResponse
    {
        return response()->json(
            $this->aiProviderService->testConnection($aiProvider)
        );
    }
}
