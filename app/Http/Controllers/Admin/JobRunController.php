<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\JobRunStatus;
use Illuminate\Http\JsonResponse;

class JobRunController extends Controller
{
    public function show(string $runId): JsonResponse
    {
        return response()->json(JobRunStatus::get($runId));
    }
}
