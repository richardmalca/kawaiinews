<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreCommentRequest;
use App\Http\Requests\Public\UpdateCommentRequest;
use App\Http\Resources\Shared\CommentResource;
use App\Models\Comment;
use App\Services\Public\CommentService;
use App\Services\Public\NewsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function __construct(
        private readonly NewsService $newsService,
        private readonly CommentService $commentService,
    ) {}

    public function index(string $slug): JsonResponse
    {
        $article = $this->newsService->findPublishedBySlug($slug);

        $comments = $this->commentService->listForArticle($article);

        return response()->json([
            'data' => CommentResource::collection($comments->items()),
            'meta' => [
                'current_page' => $comments->currentPage(),
                'last_page' => $comments->lastPage(),
                'total' => $comments->total(),
            ],
        ]);
    }

    public function store(StoreCommentRequest $request, string $slug): JsonResponse
    {
        $article = $this->newsService->findPublishedBySlug($slug);

        $comment = $this->commentService->store(
            $request->user(),
            $article,
            $request->validated('body'),
            $request->validated('reply_to_comment_id'),
            (bool) $request->validated('is_spoiler', false),
        );

        $comment->load(['user:id,name,username,avatar,custom_avatar,avatar_source', 'replyToComment.user:id,name,username']);

        return response()->json(new CommentResource($comment), 201);
    }

    public function update(UpdateCommentRequest $request, Comment $comment): JsonResponse
    {
        $comment = $this->commentService->update($comment, $request->validated('body'), $request->validated('is_spoiler'));

        $comment->load(['user:id,name,username,avatar,custom_avatar,avatar_source', 'replyToComment.user:id,name,username']);

        return response()->json(new CommentResource($comment));
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        Gate::authorize('delete', $comment);

        $this->commentService->delete($comment);

        return response()->json(['deleted' => true]);
    }

    public function toggleLike(Request $request, Comment $comment): JsonResponse
    {
        return response()->json(
            $this->commentService->toggleLike($request->user(), $comment)
        );
    }
}
