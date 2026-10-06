<?php

use App\Models\TriviaOption;
use App\Models\TriviaQuestion;
use App\Models\User;
use App\Services\Public\PointsService;

function createTodaysTrivia(): TriviaQuestion
{
    $question = TriviaQuestion::create([
        'question' => '¿En qué año se estrenó el anime original de Dragon Ball?',
        'active_date' => now()->toDateString(),
        'is_active' => true,
    ]);

    TriviaOption::create(['trivia_question_id' => $question->id, 'label' => '1986', 'is_correct' => true, 'position' => 0]);
    TriviaOption::create(['trivia_question_id' => $question->id, 'label' => '1990', 'is_correct' => false, 'position' => 1]);

    return $question->fresh(['options']);
}

test('GET /api/trivia/hoy devuelve la pregunta del día sin revelar la opción correcta', function () {
    createTodaysTrivia();

    $response = $this->getJson('/api/trivia/hoy');

    $response->assertOk()
        ->assertJsonPath('question.already_answered', false)
        ->assertJsonMissingPath('question.options.0.is_correct');
});

test('responder correctamente otorga 5 puntos', function () {
    $question = createTodaysTrivia();
    $correctOption = $question->options()->where('is_correct', true)->first();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson("/api/trivia/{$question->id}/responder", [
        'option_id' => $correctOption->id,
    ]);

    $response->assertOk()->assertJson(['correct' => true, 'already_answered' => false]);

    $this->assertDatabaseHas('point_transactions', [
        'user_id' => $user->id,
        'type' => PointsService::TRIVIA_CORRECT,
        'points' => 5,
    ]);
});

test('responder incorrectamente otorga solo 1 punto de participación', function () {
    $question = createTodaysTrivia();
    $wrongOption = $question->options()->where('is_correct', false)->first();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson("/api/trivia/{$question->id}/responder", [
        'option_id' => $wrongOption->id,
    ]);

    $response->assertOk()->assertJson(['correct' => false]);

    $this->assertDatabaseHas('point_transactions', [
        'user_id' => $user->id,
        'type' => PointsService::TRIVIA_PARTICIPATION,
        'points' => 1,
    ]);
});

test('no se puede responder dos veces la misma pregunta', function () {
    $question = createTodaysTrivia();
    $correctOption = $question->options()->where('is_correct', true)->first();
    $wrongOption = $question->options()->where('is_correct', false)->first();
    $user = User::factory()->create();

    $this->actingAs($user)->postJson("/api/trivia/{$question->id}/responder", [
        'option_id' => $correctOption->id,
    ])->assertOk();

    $response = $this->actingAs($user)->postJson("/api/trivia/{$question->id}/responder", [
        'option_id' => $wrongOption->id,
    ]);

    $response->assertOk()->assertJson(['correct' => true, 'already_answered' => true]);

    $this->assertDatabaseCount('trivia_answers', 1);
    $this->assertDatabaseCount('point_transactions', 1);
});

test('responder sin autenticar es rechazado', function () {
    $question = createTodaysTrivia();
    $correctOption = $question->options()->where('is_correct', true)->first();

    $this->postJson("/api/trivia/{$question->id}/responder", [
        'option_id' => $correctOption->id,
    ])->assertUnauthorized();
});
