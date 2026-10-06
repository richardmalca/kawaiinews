<?php

use App\Models\TriviaQuestion;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('editor');
    $this->actingAs($user);
});

test('store crea la pregunta con sus opciones', function () {
    $response = $this->post(route('admin.trivia.store'), [
        'question' => '¿Quién es el creador de One Piece?',
        'active_date' => now()->addDay()->toDateString(),
        'is_active' => true,
        'options' => [
            ['label' => 'Eiichiro Oda', 'is_correct' => true],
            ['label' => 'Akira Toriyama', 'is_correct' => false],
        ],
    ]);

    $response->assertRedirect(route('admin.trivia.index'));

    $this->assertDatabaseHas('trivia_questions', ['question' => '¿Quién es el creador de One Piece?']);
    $this->assertDatabaseHas('trivia_options', ['label' => 'Eiichiro Oda', 'is_correct' => true]);
});

test('store rechaza si no hay exactamente una opción correcta', function () {
    $response = $this->post(route('admin.trivia.store'), [
        'question' => '¿Pregunta sin respuesta correcta marcada?',
        'options' => [
            ['label' => 'A', 'is_correct' => false],
            ['label' => 'B', 'is_correct' => false],
        ],
    ]);

    $response->assertSessionHasErrors('options');
    $this->assertDatabaseCount('trivia_questions', 0);
});

test('store rechaza dos preguntas activas el mismo día', function () {
    TriviaQuestion::create(['question' => 'Ya existente', 'active_date' => now()->toDateString()]);

    $response = $this->post(route('admin.trivia.store'), [
        'question' => 'Otra para el mismo día',
        'active_date' => now()->toDateString(),
        'options' => [
            ['label' => 'A', 'is_correct' => true],
            ['label' => 'B', 'is_correct' => false],
        ],
    ]);

    $response->assertSessionHasErrors('active_date');
});

test('destroy elimina la pregunta y sus opciones', function () {
    $question = TriviaQuestion::create(['question' => '¿Pregunta?']);
    $question->options()->create(['label' => 'A', 'is_correct' => true, 'position' => 0]);

    $response = $this->delete(route('admin.trivia.destroy', $question));

    $response->assertRedirect(route('admin.trivia.index'));
    $this->assertDatabaseMissing('trivia_questions', ['id' => $question->id]);
    $this->assertDatabaseMissing('trivia_options', ['trivia_question_id' => $question->id]);
});

test('index muestra las preguntas con sus opciones', function () {
    $question = TriviaQuestion::create(['question' => '¿Pregunta?', 'active_date' => now()->toDateString()]);
    $question->options()->create(['label' => 'A', 'is_correct' => true, 'position' => 0]);

    $response = $this->get(route('admin.trivia.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('questions', 1)
        ->where('questions.0.question', '¿Pregunta?')
    );
});
