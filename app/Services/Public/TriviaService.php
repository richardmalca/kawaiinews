<?php

namespace App\Services\Public;

use App\Models\TriviaAnswer;
use App\Models\TriviaOption;
use App\Models\TriviaQuestion;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

/**
 * Trivia diaria de opción múltiple (nunca respuesta libre, a propósito:
 * así se puede corregir sola sin moderación ni IA de por medio).
 */
class TriviaService
{
    public function today(): ?TriviaQuestion
    {
        // Se cachea solo el id, nunca el modelo Eloquent entero: cachear
        // objetos serializados dio problemas intermitentes de
        // deserialización (__PHP_Incomplete_Class) entre requests. Un int
        // es trivialmente seguro de cachear, y resolver el modelo fresco
        // a partir de él es una sola query por id, prácticamente gratis.
        $id = Cache::remember('trivia:hoy:'.now()->toDateString(), 3600, function () {
            return TriviaQuestion::query()
                ->where('is_active', true)
                ->whereDate('active_date', now()->toDateString())
                ->value('id');
        });

        if (! $id) {
            return null;
        }

        return TriviaQuestion::query()
            ->with('options:id,trivia_question_id,label,is_correct,position')
            ->find($id);
    }

    public function myAnswer(User $user, TriviaQuestion $question): ?TriviaAnswer
    {
        return TriviaAnswer::query()
            ->where('user_id', $user->id)
            ->where('trivia_question_id', $question->id)
            ->first();
    }

    /**
     * @return array{correct: bool, correct_option_id: int, already_answered: bool}
     */
    public function answer(User $user, TriviaQuestion $question, TriviaOption $option): array
    {
        if ($option->trivia_question_id !== $question->id) {
            throw ValidationException::withMessages(['option' => 'Esa opción no pertenece a esta pregunta.']);
        }

        $existing = $this->myAnswer($user, $question);
        $correctOption = $question->options->firstWhere('is_correct', true) ?? $question->options()->where('is_correct', true)->first();

        if ($existing) {
            return [
                'correct' => $existing->is_correct,
                'correct_option_id' => $correctOption->id,
                'already_answered' => true,
            ];
        }

        $isCorrect = $option->is_correct;

        $answer = TriviaAnswer::create([
            'user_id' => $user->id,
            'trivia_question_id' => $question->id,
            'trivia_option_id' => $option->id,
            'is_correct' => $isCorrect,
        ]);

        $pointsService = app(PointsService::class);
        $pointsService->award($user, $isCorrect ? PointsService::TRIVIA_CORRECT : PointsService::TRIVIA_PARTICIPATION, $answer);

        return [
            'correct' => $isCorrect,
            'correct_option_id' => $correctOption->id,
            'already_answered' => false,
        ];
    }
}
