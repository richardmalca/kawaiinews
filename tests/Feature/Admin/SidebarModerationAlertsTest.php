<?php

use App\Models\Comment;
use App\Models\NewsCluster;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('a superadmin sees the count of blocked comments shared to every page', function () {
    Comment::factory()->count(2)->create(['status' => 'blocked']);
    Comment::factory()->create(['status' => 'pending']);

    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page->where('moderationAlerts.blocked_comments', 2));
});

test('a superadmin sees the count of pending high-credibility rumors', function () {
    NewsCluster::factory()->create(['status' => 'pending', 'ai_is_rumor' => true, 'ai_credibility' => 'alta']);
    NewsCluster::factory()->create(['status' => 'pending', 'ai_is_rumor' => true, 'ai_credibility' => 'baja']);
    NewsCluster::factory()->create(['status' => 'accepted', 'ai_is_rumor' => true, 'ai_credibility' => 'alta']);

    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page->where('moderationAlerts.high_credibility_rumors', 1));
});

test('a non-superadmin does not get the moderation alerts prop', function () {
    Comment::factory()->create(['status' => 'blocked']);

    $editor = User::factory()->create();
    $editor->assignRole('editor');

    $this->actingAs($editor)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page->where('moderationAlerts', null));
});

test('the blocked comments count updates after a comment is approved (cache busted)', function () {
    $comment = Comment::factory()->create(['status' => 'blocked']);

    $admin = User::factory()->create();
    $admin->assignRole('superadmin');
    $this->actingAs($admin);

    $this->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page->where('moderationAlerts.blocked_comments', 1));

    $this->post(route('admin.comments.approve', $comment));

    $this->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page->where('moderationAlerts.blocked_comments', 0));
});
