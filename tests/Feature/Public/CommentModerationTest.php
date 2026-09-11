<?php

use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use Database\Seeders\RoleSeeder;

test('a comment with a banned word is held for review instead of published', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'sos un pelotudo'])
        ->assertCreated();

    $comment = Comment::where('user_id', $user->id)->firstOrFail();
    expect($comment->status)->toBe('pending');

    // No aparece en el listado público.
    $this->getJson(route('public.comments.index', $article->slug))
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('a comment with too many links is held for review', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Mirá esto: https://spam1.test/oferta y también https://spam2.test/promo',
        ])
        ->assertCreated();

    expect(Comment::where('user_id', $user->id)->firstOrFail()->status)->toBe('pending');
});

test('a comment with a link to the site itself is not held', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Mirá esta otra nota: '.config('app.url').'/noticias/otra-noticia',
        ])
        ->assertCreated();

    expect(Comment::where('user_id', $user->id)->firstOrFail()->status)->toBe('visible');
});

test('posting the same text many times in a row gets held as repeated spam', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    foreach (range(1, 3) as $_) {
        Comment::factory()->create([
            'user_id' => $user->id,
            'news_article_id' => $article->id,
            'body' => 'promocionando lo mismo',
            'status' => 'visible',
        ]);
    }

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'promocionando lo mismo'])
        ->assertCreated();

    // `latest()` empata cuando todo se crea en el mismo segundo (típico en
    // tests) y no desempata por id — por eso ordenamos por id acá, no por
    // fecha, para asegurarnos de agarrar el último insertado.
    expect(Comment::where('user_id', $user->id)->orderByDesc('id')->first()->status)->toBe('pending');
});

test('a normal comment is published immediately, not held', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), ['body' => 'Qué buen capítulo, la verdad'])
        ->assertCreated();

    expect(Comment::where('user_id', $user->id)->firstOrFail()->status)->toBe('visible');
});

test('a pending reply does not show up under its root comment either', function () {
    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $root = Comment::factory()->create(['news_article_id' => $article->id, 'status' => 'visible']);

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'sos un pelotudo',
            'reply_to_comment_id' => $root->id,
        ])
        ->assertCreated();

    $this->getJson(route('public.comments.index', $article->slug))
        ->assertOk()
        ->assertJsonPath('data.0.replies', fn ($replies) => count($replies) === 0);
});

test('a superadmin can approve a pending comment and it becomes publicly visible', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create([
        'news_article_id' => $article->id,
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.comments.approve', $comment))
        ->assertRedirect();

    expect($comment->fresh()->status)->toBe('visible');

    $this->getJson(route('public.comments.index', $article->slug))
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('the admin panel can filter to only pending comments', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $article = NewsArticle::factory()->published()->create();
    Comment::factory()->create(['news_article_id' => $article->id, 'status' => 'visible']);
    Comment::factory()->create(['news_article_id' => $article->id, 'status' => 'pending']);

    $this->actingAs($admin)
        ->get(route('admin.comments.index', ['pending_only' => 1]))
        ->assertInertia(fn ($page) => $page->has('comments', 1));
});

test('the comments kpis include how many are pending', function () {
    $this->seed(RoleSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $article = NewsArticle::factory()->published()->create();
    Comment::factory()->count(2)->create(['news_article_id' => $article->id, 'status' => 'pending']);
    Comment::factory()->create(['news_article_id' => $article->id, 'status' => 'visible']);

    $this->actingAs($admin)
        ->get(route('admin.comments.index'))
        ->assertInertia(fn ($page) => $page->where('kpis.pending', 2));
});
