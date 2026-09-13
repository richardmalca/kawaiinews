<?php

use App\Models\ActivityLog;
use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);

    $this->admin = $user;
});

test('the activity log page lists recent entries, newest first', function () {
    ActivityLog::factory()->create(['description' => 'Primera', 'created_at' => now()->subMinute()]);
    ActivityLog::factory()->create(['description' => 'Segunda', 'created_at' => now()]);

    $response = $this->get(route('admin.activity-log.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('logs', 2)
        ->where('logs.0.description', 'Segunda')
        ->where('logs.1.description', 'Primera')
    );
});

test('rejecting a news cluster is recorded in the activity log', function () {
    $cluster = NewsCluster::factory()->create(['status' => 'pending', 'title' => 'Se anuncia algo']);

    $this->postJson(route('admin.news-review.reject', $cluster))->assertOk();

    expect(ActivityLog::where('action', 'news_cluster.rejected')->where('user_id', $this->admin->id)->exists())->toBeTrue();
});

test('approving a comment is recorded in the activity log', function () {
    $comment = Comment::factory()->create(['status' => 'pending']);

    $this->post(route('admin.comments.approve', $comment))->assertRedirect();

    expect(ActivityLog::where('action', 'comment.approved')->exists())->toBeTrue();
});

test('updating a news article is recorded in the activity log', function () {
    $article = NewsArticle::factory()->create();

    $this->put(route('admin.news-articles.update', $article), [
        'title' => 'Nuevo título',
        'category' => $article->category,
        'status' => $article->status,
    ])->assertRedirect();

    expect(ActivityLog::where('action', 'news_article.updated')->exists())->toBeTrue();
});
