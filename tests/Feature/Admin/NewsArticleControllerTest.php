<?php

use App\Models\NewsArticle;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('articles index paginates results', function () {
    NewsArticle::factory()->count(20)->create();

    $response = $this->get(route('admin.news-articles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('articles', 15)
        ->where('meta.total', 20)
        ->where('meta.last_page', 2)
    );
});

test('articles index can be filtered by category', function () {
    NewsArticle::factory()->count(3)->create(['category' => 'anime']);
    NewsArticle::factory()->count(4)->create(['category' => 'geek']);

    $response = $this->get(route('admin.news-articles.index', ['category' => 'geek']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('articles', 4)
        ->where('category', 'geek')
    );
});
