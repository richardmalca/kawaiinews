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
            'kpis' => $this->kpis(),
        ]);
    }

    /**
     * @return array{total: int, today: int, this_week: int, active_users: int}
     */
    private function kpis(): array
    {
        return [
            'total' => ActivityLog::count(),
            'today' => ActivityLog::whereDate('created_at', today())->count(),
            'this_week' => ActivityLog::where('created_at', '>=', now()->startOfWeek())->count(),
            'active_users' => ActivityLog::whereNotNull('user_id')->distinct('user_id')->count('user_id'),
        ];
    }
}
