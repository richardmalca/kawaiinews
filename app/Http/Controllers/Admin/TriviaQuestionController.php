<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTriviaQuestionRequest;
use App\Http\Resources\Admin\TriviaQuestionResource;
use App\Models\TriviaQuestion;
use App\Services\Admin\TriviaQuestionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TriviaQuestionController extends Controller
{
    public function __construct(private readonly TriviaQuestionService $triviaQuestionService) {}

    public function index(): Response
    {
        $questions = $this->triviaQuestionService->paginated();

        return Inertia::render('admin/trivia/index', [
            'questions' => TriviaQuestionResource::collection($questions->items())->resolve(),
            'meta' => [
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage(),
                'total' => $questions->total(),
            ],
        ]);
    }

    public function store(StoreTriviaQuestionRequest $request): RedirectResponse
    {
        $this->triviaQuestionService->create($request->validated(), $request->user());

        return to_route('admin.trivia.index');
    }

    public function update(StoreTriviaQuestionRequest $request, TriviaQuestion $trivia): RedirectResponse
    {
        $this->triviaQuestionService->update($trivia, $request->validated());

        return to_route('admin.trivia.index');
    }

    public function destroy(TriviaQuestion $trivia): RedirectResponse
    {
        $this->triviaQuestionService->delete($trivia);

        return to_route('admin.trivia.index');
    }
}
