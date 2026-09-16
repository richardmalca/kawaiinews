<?php

use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\ScrapedItem;
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

test('the pending view excludes clusters whose article is already published, and the published view shows only those', function () {
    $stillPending = NewsCluster::factory()->create(['status' => 'pending']);
    $draftArticleCluster = NewsCluster::factory()->create(['status' => 'accepted']);
    NewsArticle::factory()->create(['news_cluster_id' => $draftArticleCluster->id, 'status' => 'draft']);
    $publishedArticleCluster = NewsCluster::factory()->create(['status' => 'accepted']);
    NewsArticle::factory()->published()->create(['news_cluster_id' => $publishedArticleCluster->id]);

    $this->get(route('admin.news-review.index'))
        ->assertInertia(fn ($page) => $page
            ->where('view', 'pending')
            ->has('clusters', 2)
        );

    $this->get(route('admin.news-review.index', ['view' => 'published']))
        ->assertInertia(fn ($page) => $page
            ->where('view', 'published')
            ->has('clusters', 1)
            ->where('clusters.0.id', $publishedArticleCluster->id)
        );
});

test('each cluster exposes a date_bucket so the review queue can be grouped like a calendar', function () {
    $today = NewsCluster::factory()->create(['status' => 'pending', 'first_seen_at' => now()]);
    $yesterday = NewsCluster::factory()->create(['status' => 'pending', 'first_seen_at' => now()->subDay()]);
    $thisWeek = NewsCluster::factory()->create(['status' => 'pending', 'first_seen_at' => now()->subDays(3)]);
    $older = NewsCluster::factory()->create(['status' => 'pending', 'first_seen_at' => now()->subDays(9)]);

    $response = $this->get(route('admin.news-review.index'));

    $response->assertOk();
    $buckets = collect($response->viewData('page')['props']['clusters'])->pluck('date_bucket', 'id');

    expect($buckets[$today->id])->toBe('hoy')
        ->and($buckets[$yesterday->id])->toBe('ayer')
        ->and($buckets[$thisWeek->id])->toBe('semana')
        ->and($buckets[$older->id])->toBe('antes');
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

test('review queue can be searched by title', function () {
    NewsCluster::factory()->create(['status' => 'pending', 'title' => 'Se anuncia la temporada 2 de Frieren']);
    NewsCluster::factory()->create(['status' => 'pending', 'title' => 'Nuevo tráiler de Chainsaw Man']);

    $response = $this->get(route('admin.news-review.index', ['search' => 'frieren']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('clusters', 1)
        ->where('search', 'frieren')
        ->where('clusters.0.title', 'Se anuncia la temporada 2 de Frieren')
    );
});

test('rejecting a cluster responds with json instead of redirecting, so the admin can reject several in a row without navigating away', function () {
    $cluster = NewsCluster::factory()->create(['status' => 'pending']);

    $response = $this->postJson(route('admin.news-review.reject', $cluster));

    $response->assertOk()->assertJson(['status' => 'ok']);
    expect($cluster->fresh()->status)->toBe('rejected');
});

test('a rejected cluster can be restored back to pending (undo)', function () {
    $cluster = NewsCluster::factory()->create(['status' => 'rejected']);

    $response = $this->postJson(route('admin.news-review.restore', $cluster));

    $response->assertOk()->assertJson(['status' => 'ok']);
    expect($cluster->fresh()->status)->toBe('pending');
});

test('restoring a cluster that was not rejected does nothing', function () {
    $cluster = NewsCluster::factory()->create(['status' => 'accepted']);

    $this->postJson(route('admin.news-review.restore', $cluster))->assertOk();

    expect($cluster->fresh()->status)->toBe('accepted');
});

test('merging two clusters moves the sources into the target and rejects the source', function () {
    $source = NewsCluster::factory()->create(['status' => 'pending', 'sources_count' => 1, 'relevance_score' => 5]);
    $target = NewsCluster::factory()->create(['status' => 'pending', 'sources_count' => 1, 'relevance_score' => 10]);
    $sourceItem = ScrapedItem::factory()->create(['news_cluster_id' => $source->id]);
    ScrapedItem::factory()->create(['news_cluster_id' => $target->id]);

    $response = $this->postJson(route('admin.news-review.merge', $source), ['target_id' => $target->id]);

    $response->assertOk()->assertJson(['status' => 'ok']);
    expect($source->fresh()->status)->toBe('rejected')
        ->and($sourceItem->fresh()->news_cluster_id)->toBe($target->id)
        ->and($target->fresh())
        ->sources_count->toBe(2)
        ->relevance_score->toBe(10.0);
});

test('merging into itself is rejected', function () {
    $cluster = NewsCluster::factory()->create(['status' => 'pending']);

    $this->postJson(route('admin.news-review.merge', $cluster), ['target_id' => $cluster->id])
        ->assertStatus(422);
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
