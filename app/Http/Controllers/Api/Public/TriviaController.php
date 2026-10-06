<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\TriviaQuestion;
use App\Services\Public\TriviaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TriviaController extends Controller
{
    public function __construct(private readonly TriviaService $triviaService) {}

    public function today(Request $request): JsonResponse
    {
        $question = $this->triviaService->today();

        if (! $question) {
            return response()->json(['question' => null]);
        }

        $user = $request->user();
        $myAnswer = $user ? $this->triviaService->myAnswer($user, $question) : null;

        return response()->json([
            'question' => [
                'id' => $question->id,
                'question' => $question->question,
                'options' => $question->options->map(fn ($option) => [
                    'id' => $option->id,
                    'label' => $option->label,
                ]),
                'already_answered' => (bool) $myAnswer,
                'my_option_id' => $myAnswer?->trivia_option_id,
                'correct_option_id' => $myAnswer ? $question->options->firstWhere('is_correct', true)?->id : null,
            ],
        ]);
    }

    public function answer(Request $request, TriviaQuestion $triviaQuestion): JsonResponse
    {
        $validated = $request->validate([
            'option_id' => ['required', 'integer'],
        ]);

        $option = $triviaQuestion->options()->findOrFail($validated['option_id']);

        $result = $this->triviaService->answer($request->user(), $triviaQuestion, $option);

        return response()->json($result);
    }
}
