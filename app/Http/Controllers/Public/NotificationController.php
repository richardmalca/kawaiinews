<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Public\NewsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService
    ) {}

    public function index(Request $request): JsonResponse|Response
    {
        $user = $request->user();
        $filter = $request->query('filtro', 'todas');

        // Para peticiones AJAX de la campanita en el navbar
        if ($request->wantsJson()) {
            $notifications = $user->notifications()
                ->latest()
                ->limit(20)
                ->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'data' => $n->data,
                    'read_at' => $n->read_at?->toISOString(),
                    'created_at' => $n->created_at?->diffForHumans(),
                ]);

            return response()->json([
                'unread_count' => $user->unreadNotifications()->count(),
                'notifications' => $notifications,
            ]);
        }

        // Para la página completa /notificaciones (Centro de Notificaciones)
        $query = $user->notifications()->latest();

        if ($filter === 'no_leidas') {
            $query->whereNull('read_at');
        } elseif ($filter === 'reacciones') {
            $query->where('data->type', 'article_liked');
        } elseif ($filter === 'guardados') {
            $query->whereIn('data->type', ['article_saved', 'article_shared']);
        } elseif ($filter === 'comentarios') {
            $query->whereIn('data->type', ['comment_reply', 'comment_mention', 'article_commented']);
        } elseif ($filter === 'seguidores') {
            $query->where('data->type', 'user_follow');
        } elseif ($filter === 'noticias') {
            $query->where('data->type', 'new_article');
        }

        $paginated = $query->paginate(15)->through(fn ($n) => [
            'id' => $n->id,
            'data' => $n->data,
            'read_at' => $n->read_at?->toISOString(),
            'created_at' => $n->created_at?->diffForHumans(),
        ])->withQueryString();

        return Inertia::render('public/notifications/index', [
            'notifications' => $paginated,
            'unreadCount' => $user->unreadNotifications()->count(),
            'currentFilter' => $filter,
            'categories' => $this->newsService->getCategoriesSummary(),
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'unread_count' => 0,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->delete();

        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return response()->json([
            'success' => true,
            'unread_count' => 0,
        ]);
    }
}
