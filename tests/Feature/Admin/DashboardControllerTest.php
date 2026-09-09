<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;

test('an authenticated staff member sees the dashboard with kpi data', function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('editor');

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('summary')
            ->has('growth')
            ->has('health')
            ->has('timeline', 14)
            ->has('topArticles')
            ->has('categories')
        );
});

test('a guest is redirected away from the dashboard', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});
