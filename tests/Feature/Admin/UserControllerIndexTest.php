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
