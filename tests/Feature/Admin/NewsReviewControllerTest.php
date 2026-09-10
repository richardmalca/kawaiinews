<?php

use App\Models\NewsCluster;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('review queue paginates pending clusters', function () {
    NewsCluster::factory()->count(25)->create(['status' => 'pending']);

    $response = $this->get(route('admin.news-review.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('clusters', 20)
        ->where('meta.total', 25)
        ->where('meta.last_page', 2)
    );
});

test('the index exposes when news:scrape and news:auto-review will run next', function () {
    $response = $this->get(route('admin.news-review.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('nextScrapeAt.at')
        ->has('nextScrapeAt.in')
        ->has('nextAutoReviewAt.at')
        ->has('nextAutoReviewAt.in')
    );
});

test('review queue can be filtered by category', function () {
    NewsCluster::factory()->count(3)->create(['status' => 'pending', 'category' => 'anime']);
    NewsCluster::factory()->count(2)->create(['status' => 'pending', 'category' => 'gaming']);

    $response = $this->get(route('admin.news-review.index', ['category' => 'gaming']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('clusters', 2)
        ->where('category', 'gaming')
    );
});

test('review queue can be sorted by newest and oldest, falling back to first_seen_at without scraped items', function () {
    $old = NewsCluster::factory()->create([
        'status' => 'pending',
        'title' => 'Cluster viejo',
        'first_seen_at' => now()->subDays(5),
    ]);
    $new = NewsCluster::factory()->create([
        'status' => 'pending',
        'title' => 'Cluster nuevo',
        'first_seen_at' => now(),
    ]);

    $this->get(route('admin.news-review.index', ['sort' => 'newest']))
        ->assertInertia(fn ($page) => $page->where('clusters.0.id', $new->id));

    $this->get(route('admin.news-review.index', ['sort' => 'oldest']))
        ->assertInertia(fn ($page) => $page->where('clusters.0.id', $old->id));
});
