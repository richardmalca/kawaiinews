<?php

use App\Jobs\ModerateCommentWithAiJob;
use App\Models\AiProvider;
use App\Models\Comment;
use App\Models\LearnedBannedPhrase;
use App\Models\NewsArticle;
use App\Models\User;
use App\Services\Public\CommentModerationService;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Queue;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

test('storing a comment that gets held dispatches the ai moderation job', function () {
    Queue::fake();

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'sos un pelotudo'])
        ->assertCreated();

    Queue::assertPushed(ModerateCommentWithAiJob::class, 1);
});

test('a normal comment (not held by layer 1) never triggers the ai job', function () {
    Queue::fake();

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'Qué buen capítulo'])
        ->assertCreated();

    Queue::assertNotPushed(ModerateCommentWithAiJob::class);
});

test('without an ai provider activated for moderation, the job does nothing and the comment stays pending', function () {
    $comment = Comment::factory()->create(['status' => 'pending']);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh())
        ->status->toBe('pending')
        ->moderation_reason->toBeNull();
});

test('the ai approves the comment and it becomes visible', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    $comment = Comment::factory()->create(['status' => 'pending', 'body' => 'esto no está tan mal']);

    Prism::fake([TextResponseFake::make()->withText('OK')]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh())
        ->status->toBe('visible')
        ->moderation_reason->toBeNull();
});

test('the ai blocks the comment, tags it as violating community guidelines, and it shows up as a placeholder in the thread', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'status' => 'pending', 'body' => 'algo bien grave']);

    Prism::fake([
        TextResponseFake::make()->withText('BLOQUEAR: insulto grave hacia otro usuario'),
    ]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    $fresh = $comment->fresh();
    expect($fresh->status)->toBe('blocked')
        ->and($fresh->moderation_reason)->toBe('insulto grave hacia otro usuario');

    // A diferencia de "pending", un "blocked" SÍ aparece en el hilo
    // público (como placeholder, ver CommentResource::is_blocked) — no
    // desaparece del todo.
    $this->getJson(route('public.comments.index', $article->slug))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.is_blocked', true)
        ->assertJsonPath('data.0.body', 'algo bien grave');
});

test('when the ai points out the offending phrase, it gets learned for layer 1', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    $comment = Comment::factory()->create(['status' => 'pending', 'body' => 'sos un gilaso, te odio']);

    Prism::fake([
        TextResponseFake::make()->withText('BLOQUEAR: insulto hacia otro usuario | FRASE: gilaso'),
    ]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect(LearnedBannedPhrase::where('phrase', 'gilaso')->exists())->toBeTrue();

    // Ahora un comentario nuevo con esa misma palabra lo agarra la Capa 1
    // solo, sin tener que volver a consultar a la IA.
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'GILASO de mierda'])
        ->assertCreated();

    expect(Comment::where('user_id', $user->id)->firstOrFail()->status)->toBe('pending');
});

test('the ai blocking for a general tone (no specific phrase) does not learn anything', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    $comment = Comment::factory()->create(['status' => 'pending']);

    Prism::fake([
        TextResponseFake::make()->withText('BLOQUEAR: tono agresivo general'),
    ]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect(LearnedBannedPhrase::count())->toBe(0);
});

test('an unexpected ai response does not auto-approve, gets blocked with a generic reason', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    $comment = Comment::factory()->create(['status' => 'pending']);

    Prism::fake([TextResponseFake::make()->withText('no entendí la pregunta')]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh())
        ->status->toBe('blocked')
        ->moderation_reason->toBe('Vulnera las normas de la comunidad');
});

test('an already-approved-by-a-human comment is left alone by the ai job (avoids a race)', function () {
    $comment = Comment::factory()->create(['status' => 'visible']);

    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([TextResponseFake::make()->withText('BLOQUEAR: lo que sea')]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh()->status)->toBe('visible');
});

test('an admin can activate an ai provider for comment moderation, same as image/audio', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $provider = AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => false,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.ai-providers.activate', $provider), ['capability' => 'moderation'])
        ->assertRedirect();

    expect($provider->fresh()->is_active_for_moderation)->toBeTrue();
});
