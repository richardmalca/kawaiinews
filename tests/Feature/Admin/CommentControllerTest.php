<?php

use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use Database\Seeders\RoleSeeder;

test('a superadmin can see the comment moderation panel with kpis', function () {
    $this->seed(RoleSeeder::class);
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $article = NewsArticle::factory()->published()->create();
    Comment::factory()->create(['news_article_id' => $article->id, 'is_spoiler' => true]);
    Comment::factory()->create(['news_article_id' => $article->id]);

    $response = $this->actingAs($superadmin)->get(route('admin.comments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('kpis.total', 2)
        ->where('kpis.spoilers', 1)
        ->has('comments', 2)
    );
});

test('an editor cannot access the comment moderation panel', function () {
    $this->seed(RoleSeeder::class);
    $editor = User::factory()->create();
    $editor->assignRole('editor');

    $this->actingAs($editor)->get(route('admin.comments.index'))->assertForbidden();
});

test('the panel can filter by search text and by spoilers only', function () {
    $this->seed(RoleSeeder::class);
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $article = NewsArticle::factory()->published()->create();
    Comment::factory()->create(['news_article_id' => $article->id, 'body' => 'esto es un spoiler grande', 'is_spoiler' => true]);
    Comment::factory()->create(['news_article_id' => $article->id, 'body' => 'comentario normal', 'is_spoiler' => false]);

    $this->actingAs($superadmin)
        ->get(route('admin.comments.index', ['spoilers_only' => 1]))
        ->assertInertia(fn ($page) => $page->has('comments', 1));

    $this->actingAs($superadmin)
        ->get(route('admin.comments.index', ['search' => 'normal']))
        ->assertInertia(fn ($page) => $page->has('comments', 1));
});

test('a superadmin can delete any comment from the moderation panel', function () {
    $this->seed(RoleSeeder::class);
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $author = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $author->id]);

    $this->actingAs($superadmin)
        ->delete(route('admin.comments.destroy', $comment))
        ->assertRedirect();

    expect(Comment::find($comment->id))->toBeNull();
});
