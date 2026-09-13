<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    private const PER_PAGE = 30;

    public function index(): Response
    {
        $logs = ActivityLog::with('user:id,name')
            ->latest('created_at')
            ->paginate(self::PER_PAGE);

        return Inertia::render('admin/activity-log/index', [
            'logs' => $logs->getCollection()->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'user' => $log->user?->name ?? 'Sistema',
                'created_at_formatted' => $log->created_at->diffForHumans(),
            ])->values(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
