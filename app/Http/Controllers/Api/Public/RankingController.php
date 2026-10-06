<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Services\Public\RankingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RankingController extends Controller
{
    public function __construct(private readonly RankingService $rankingService) {}

    public function index(): JsonResponse
    {
        return response()->json(['ranking' => $this->rankingService->weeklyTop()]);
    }

    public function miPosicion(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['points' => 0, 'rank' => null]);
        }

        return response()->json($this->rankingService->myPosition($user));
    }
}
