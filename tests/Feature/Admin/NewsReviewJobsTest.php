<?php

use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('scraping runs as a queued job and reports the run status when done', function () {
    NewsSource::factory()->create([
        'rss_url' => 'https://good-feed.test/feed',
        'is_active' => true,
    ]);

    Http::fake([
        'good-feed.test/*' => Http::response('<rss><channel></channel></rss>', 200),
    ]);

    $response = $this->postJson(route('admin.news-review.scrape'));

    $response->assertOk();
    $runId = $response->json('run_id');
    expect($runId)->not->toBeNull();

    $status = $this->getJson(route('admin.news-review.run-status', $runId));

    $status->assertOk()
        ->assertJsonPath('status', 'done')
        ->assertJsonPath('result.sources_scraped', 1);
});

test('applying ai verdicts accepts every pending cluster marked publish', function () {
    NewsCluster::factory()->count(2)->create(['status' => 'pending', 'ai_verdict' => 'publish']);
    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'discard']);

    $response = $this->postJson(route('admin.news-review.apply-ai-verdicts'));
    $runId = $response->json('run_id');

    $status = $this->getJson(route('admin.news-review.run-status', $runId));

    $status->assertOk()
        ->assertJsonPath('status', 'done')
        ->assertJsonPath('result.applied', 2);

    expect(NewsCluster::where('status', 'accepted')->count())->toBe(2);
    expect(NewsCluster::where('status', 'pending')->count())->toBe(1);
});
