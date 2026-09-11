<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminCommentResource;
use App\Models\Comment;
use App\Models\NewsArticle;
use App\Services\Public\CommentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CommentController extends Controller
{
    public function __construct(private readonly CommentService $commentService) {}

    public function index(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->value() ?: null,
            'article_id' => $request->integer('article_id') ?: null,
            'spoilers_only' => $request->boolean('spoilers_only'),
            'pending_only' => $request->boolean('pending_only'),
            'blocked_only' => $request->boolean('blocked_only'),
        ];

        $comments = $this->commentService->adminList($filters);

        return Inertia::render('admin/comments/index', [
            'comments' => AdminCommentResource::collection($comments->items())->resolve(),
            'meta' => [
                'current_page' => $comments->currentPage(),
                'last_page' => $comments->lastPage(),
                'total' => $comments->total(),
            ],
            'filters' => [
                'search' => $filters['search'],
                'article_id' => $filters['article_id'],
                'spoilers_only' => $filters['spoilers_only'],
                'pending_only' => $filters['pending_only'],
                'blocked_only' => $filters['blocked_only'],
            ],
            'kpis' => $this->commentService->adminKpis(),
            // Para el filtro por noticia: solo las que ya tienen comentarios.
            'articlesWithComments' => NewsArticle::query()
                ->whereHas('comments')
                ->orderBy('title')
                ->get(['id', 'title'])
                ->map(fn (NewsArticle $article) => ['id' => $article->id, 'title' => $article->title])
                ->values(),
        ]);
    }

    public function approve(Comment $comment): RedirectResponse
    {
        // Sin Gate::authorize acá: esta ruta ya está detrás de
        // role:superadmin en routes/web.php, igual que el resto de este
        // controller.
        $this->commentService->approve($comment);

        return back();
    }

    public function destroy(Comment $comment): RedirectResponse
    {
        Gate::authorize('delete', $comment);

        $this->commentService->delete($comment);

        return back();
    }
}
