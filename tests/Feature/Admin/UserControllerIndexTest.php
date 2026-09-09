<?php

use App\Models\NewsArticle;
use App\Models\User;
use Database\Seeders\RoleSeeder;

test('the users index shows how many published articles each user has authored', function () {
    $this->seed(RoleSeeder::class);

    $actingAdmin = User::factory()->create();
    $actingAdmin->assignRole('superadmin');

    $editor = User::factory()->create();
    $editor->assignRole('editor');

    NewsArticle::factory()->published()->create(['author_id' => $editor->id]);
    NewsArticle::factory()->published()->create(['author_id' => $editor->id]);
    NewsArticle::factory()->create(['status' => 'draft', 'author_id' => $editor->id]);

    $response = $this->actingAs($actingAdmin)->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('users', fn ($users) => collect($users)
            ->firstWhere('id', $editor->id)['published_articles_count'] === 2
        )
    );
});

test('the users index exposes kpis for total staff, roles, login method and published articles', function () {
    $this->seed(RoleSeeder::class);

    $superadmin = User::factory()->create(['google_id' => '123456789']);
    $superadmin->assignRole('superadmin');

    $passwordEditor = User::factory()->create(['google_id' => null]);
    $passwordEditor->assignRole('editor');

    NewsArticle::factory()->published()->create(['author_id' => $superadmin->id]);
    NewsArticle::factory()->published()->create(['author_id' => $passwordEditor->id]);

    $response = $this->actingAs($superadmin)->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('kpis.total', 2)
        ->where('kpis.by_role.superadmin', 1)
        ->where('kpis.by_role.editor', 1)
        ->where('kpis.by_role.admin', 0)
        ->where('kpis.google_accounts', 1)
        ->where('kpis.password_accounts', 1)
        ->where('kpis.published_articles', 2)
    );
});
