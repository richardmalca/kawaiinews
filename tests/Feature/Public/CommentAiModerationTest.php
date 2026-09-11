<?php

use App\Jobs\ModerateCommentWithAiJob;
use App\Models\AiProvider;
use App\Models\Comment;
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

test('the ai blocks the comment and tags it as violating community guidelines', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    $comment = Comment::factory()->create(['status' => 'pending', 'body' => 'algo bien grave']);

    Prism::fake([
        TextResponseFake::make()->withText('BLOQUEAR: insulto grave hacia otro usuario'),
    ]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    $fresh = $comment->fresh();
    expect($fresh->status)->toBe('pending')
        ->and($fresh->moderation_reason)->toBe('insulto grave hacia otro usuario');
});

test('an unexpected ai response does not auto-approve, stays pending with a generic reason', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active_for_moderation' => true,
        'api_key' => 'test-key',
    ]);

    $comment = Comment::factory()->create(['status' => 'pending']);

    Prism::fake([TextResponseFake::make()->withText('no entendí la pregunta')]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect($comment->fresh())
        ->status->toBe('pending')
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
