<?php

namespace App\Services\Admin;

use App\Models\TriviaQuestion;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class TriviaQuestionService
{
    public function paginated(int $perPage = 20): LengthAwarePaginator
    {
        return TriviaQuestion::query()
            ->withCount('answers')
            ->with('options:id,trivia_question_id,label,is_correct,position')
            ->orderByDesc('active_date')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * @param  array{question: string, active_date: ?string, is_active?: bool, options: array<int, array{label: string, is_correct?: bool}>}  $data
     */
    public function create(array $data, User $creator): TriviaQuestion
    {
        $question = TriviaQuestion::create([
            'question' => $data['question'],
            'active_date' => $data['active_date'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $creator->id,
        ]);

        $this->syncOptions($question, $data['options']);
        $this->forgetTodaysCacheIfRelevant($question);

        return $question;
    }

    /**
     * @param  array{question: string, active_date: ?string, is_active?: bool, options: array<int, array{label: string, is_correct?: bool}>}  $data
     */
    public function update(TriviaQuestion $question, array $data): TriviaQuestion
    {
        $question->update([
            'question' => $data['question'],
            'active_date' => $data['active_date'] ?? null,
            'is_active' => $data['is_active'] ?? $question->is_active,
        ]);

        $question->options()->delete();
        $this->syncOptions($question, $data['options']);
        $this->forgetTodaysCacheIfRelevant($question);

        return $question;
    }

    public function delete(TriviaQuestion $question): void
    {
        $this->forgetTodaysCacheIfRelevant($question);
        $question->delete();
    }

    /**
     * @param  array<int, array{label: string, is_correct?: bool}>  $options
     */
    private function syncOptions(TriviaQuestion $question, array $options): void
    {
        foreach (array_values($options) as $position => $option) {
            $question->options()->create([
                'label' => $option['label'],
                'is_correct' => (bool) ($option['is_correct'] ?? false),
                'position' => $position,
            ]);
        }
    }

    private function forgetTodaysCacheIfRelevant(TriviaQuestion $question): void
    {
        if ($question->active_date) {
            Cache::forget('trivia:hoy:'.$question->active_date->toDateString());
        }
    }
}
