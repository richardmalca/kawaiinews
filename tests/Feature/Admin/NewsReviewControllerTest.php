<?php

use App\Models\NewsArticle;
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

test('the index exposes kpis: total in the queue, published, unpublished and analyzed by ai', function () {
    // Pendiente, sin analizar todavía.
    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);
    // Pendiente, ya analizada por la IA.
    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish']);
    // Aceptada pero el artículo todavía está en borrador (no cuenta como "publicada").
    $draftArticleCluster = NewsCluster::factory()->create(['status' => 'accepted', 'ai_verdict' => 'publish']);
    NewsArticle::factory()->create(['news_cluster_id' => $draftArticleCluster->id, 'status' => 'draft']);
    // Aceptada y con el artículo ya publicado.
    $publishedArticleCluster = NewsCluster::factory()->create(['status' => 'accepted', 'ai_verdict' => 'publish']);
    NewsArticle::factory()->published()->create(['news_cluster_id' => $publishedArticleCluster->id]);
    // Rechazada: no cuenta para nada de esto (no está en la bandeja).
    NewsCluster::factory()->create(['status' => 'rejected']);

    $response = $this->get(route('admin.news-review.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('kpis.total', 4)
        ->where('kpis.published', 1)
        ->where('kpis.unpublished', 3)
        ->where('kpis.analyzed', 3)
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
