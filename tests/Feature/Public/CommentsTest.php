<?php

use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use Database\Seeders\RoleSeeder;

test('anyone can list comments for a published article', function () {
    $article = NewsArticle::factory()->published()->create();
    $root = Comment::factory()->create(['news_article_id' => $article->id]);
    Comment::factory()->replyTo($root)->create(['news_article_id' => $article->id]);

    $this->getJson(route('public.comments.index', $article->slug))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.replies', fn ($replies) => count($replies) === 1);
});

test('a logged in user can post a root comment', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'Muy buena noticia'])
        ->assertCreated()
        ->assertJsonPath('body', 'Muy buena noticia')
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('reply_to', null);

    expect(Comment::where('news_article_id', $article->id)->whereNull('parent_id')->count())->toBe(1);
});

test('a guest cannot post a comment', function () {
    $article = NewsArticle::factory()->published()->create();

    $this->postJson(route('public.comments.store', $article->slug), ['body' => 'hola'])
        ->assertUnauthorized();
});

test('replying to a root comment nests it under that root', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $root = Comment::factory()->create(['news_article_id' => $article->id]);

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Respuesta 1',
            'reply_to_comment_id' => $root->id,
        ])
        ->assertCreated()
        ->assertJsonPath('reply_to', null);

    $reply = Comment::where('body', 'Respuesta 1')->first();

    expect($reply->parent_id)->toBe($root->id)
        ->and($reply->reply_to_comment_id)->toBeNull();
});

test('replying to a reply flattens under the same root but tags who was replied to (regression: the exact bug reported)', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $root = Comment::factory()->create(['news_article_id' => $article->id]);
    $reply2 = Comment::factory()->replyTo($root)->create(['news_article_id' => $article->id]);

    $response = $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Respuesta 3 a Respuesta 2',
            'reply_to_comment_id' => $reply2->id,
        ])
        ->assertCreated();

    $reply3 = Comment::where('body', 'Respuesta 3 a Respuesta 2')->first();

    // Se aplana bajo la raíz, NO queda anidada dentro de reply2.
    expect($reply3->parent_id)->toBe($root->id)
        ->and($reply3->reply_to_comment_id)->toBe($reply2->id);

    $response->assertJsonPath('reply_to.comment_id', $reply2->id)
        ->assertJsonPath('reply_to.user_id', $reply2->user_id);

    // Al listar, reply3 aparece como una respuesta más de la raíz (aplanada),
    // no anidada dentro de reply2.
    $this->getJson(route('public.comments.index', $article->slug))
        ->assertOk()
        ->assertJsonPath('data.0.replies', fn ($replies) => count($replies) === 2);
});

test('a comment can be posted marked as spoiler', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Muere el protagonista en el capítulo final',
            'is_spoiler' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('is_spoiler', true);

    $this->getJson(route('public.comments.index', $article->slug))
        ->assertOk()
        ->assertJsonPath('data.0.is_spoiler', true);
});

test('a comment defaults to not being a spoiler', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'Sin spoilers'])
        ->assertCreated()
        ->assertJsonPath('is_spoiler', false);
});

test('the author can flag their own comment as spoiler when editing it', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $user->id, 'is_spoiler' => false]);

    $this->actingAs($user)
        ->patchJson(route('public.comments.update', $comment), ['body' => $comment->body, 'is_spoiler' => true])
        ->assertOk()
        ->assertJsonPath('is_spoiler', true);
});

test('the author can update their own comment', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $user->id]);

    $this->travel(1)->minute();

    $this->actingAs($user)
        ->patchJson(route('public.comments.update', $comment), ['body' => 'Editado'])
        ->assertOk()
        ->assertJsonPath('body', 'Editado')
        ->assertJsonPath('is_edited', true);
});

test('a user cannot update someone else\'s comment', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $other->id]);

    $this->actingAs($user)
        ->patchJson(route('public.comments.update', $comment), ['body' => 'hackeo'])
        ->assertForbidden();
});

test('the author can delete their own comment', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $user->id]);

    $this->actingAs($user)
        ->deleteJson(route('public.comments.destroy', $comment))
        ->assertOk();

    expect(Comment::find($comment->id))->toBeNull();
});

test('deleting a root comment also removes its replies', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $root = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $user->id]);
    $reply = Comment::factory()->replyTo($root)->create(['news_article_id' => $article->id]);

    $this->actingAs($user)
        ->deleteJson(route('public.comments.destroy', $root))
        ->assertOk();

    expect(Comment::find($root->id))->toBeNull()
        ->and(Comment::find($reply->id))->toBeNull();
});

test('staff can moderate and delete a comment they did not write', function () {
    $this->seed(RoleSeeder::class);

    $editor = User::factory()->create();
    $editor->assignRole('editor');

    $author = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $author->id]);

    $this->actingAs($editor)
        ->deleteJson(route('public.comments.destroy', $comment))
        ->assertOk();

    expect(Comment::find($comment->id))->toBeNull();
});

test('a logged in user can like and unlike a comment', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id]);

    $this->actingAs($user)
        ->postJson(route('public.comments.like', $comment))
        ->assertOk()
        ->assertJson(['liked' => true, 'total_likers' => 1]);

    $this->actingAs($user)
        ->postJson(route('public.comments.like', $comment))
        ->assertOk()
        ->assertJson(['liked' => false, 'total_likers' => 0]);
});

test('article author receives a notification when someone comments on their article', function () {
    $author = User::factory()->create();
    $commenter = User::factory()->create();
    $article = NewsArticle::factory()->published()->create(['author_id' => $author->id]);

    $this->actingAs($commenter)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => '¡Excelente artículo, gracias!',
        ])
        ->assertCreated();

    $notification = $author->notifications()->first();
    expect($notification)->not->toBeNull()
        ->and($notification->data['type'])->toBe('article_commented')
        ->and($notification->data['commenter_id'])->toBe($commenter->id)
        ->and($notification->data['article_id'])->toBe($article->id)
        ->and($notification->data['total_comments'])->toBe(1);
});

test('article author notifications are aggregated when multiple comments arrive', function () {
    $author = User::factory()->create();
    $commenter1 = User::factory()->create();
    $commenter2 = User::factory()->create();
    $article = NewsArticle::factory()->published()->create(['author_id' => $author->id]);

    $this->actingAs($commenter1)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Primer comentario',
        ])
        ->assertCreated();

    $this->actingAs($commenter2)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Segundo comentario',
        ])
        ->assertCreated();

    expect($author->unreadNotifications()->count())->toBe(1);

    $notification = $author->unreadNotifications()->first();
    expect($notification->data['type'])->toBe('article_commented')
        ->and($notification->data['commenter_id'])->toBe($commenter2->id)
        ->and($notification->data['total_comments'])->toBe(2);
});

test('author commenting on their own article does not send notification to themselves', function () {
    $author = User::factory()->create();
    $article = NewsArticle::factory()->published()->create(['author_id' => $author->id]);

    $this->actingAs($author)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Mi propio comentario como autor',
        ])
        ->assertCreated();

    expect($author->notifications()->count())->toBe(0);
});

test('comment author receives a notification when someone likes their comment', function () {
    $author = User::factory()->create();
    $liker = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create([
        'news_article_id' => $article->id,
        'user_id' => $author->id,
    ]);

    $this->actingAs($liker)
        ->postJson(route('public.comments.like', $comment))
        ->assertOk();

    $notification = $author->notifications()->first();
    expect($notification)->not->toBeNull()
        ->and($notification->data['type'])->toBe('comment_liked')
        ->and($notification->data['liker_id'])->toBe($liker->id)
        ->and($notification->data['comment_id'])->toBe($comment->id)
        ->and($notification->data['total_reactions'])->toBe(1);
});

test('comment author does not receive notification if disabled in preferences', function () {
    $author = User::factory()->create([
        'notify_comment_likes' => false,
    ]);
    $liker = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create([
        'news_article_id' => $article->id,
        'user_id' => $author->id,
    ]);

    $this->actingAs($liker)
        ->postJson(route('public.comments.like', $comment))
        ->assertOk();

    expect($author->notifications()->count())->toBe(0);
});
