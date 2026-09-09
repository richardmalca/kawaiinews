<?php

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Audio\AudioResponse;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\ImageResponseFake;
use Prism\Prism\Testing\TextResponseFake;
use Prism\Prism\ValueObjects\GeneratedAudio;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('generating an image queues a job and the run status endpoint reports it done', function () {
    Storage::fake('public');

    AiProvider::factory()->create([
        'provider' => 'openai',
        'api_key' => 'test-key',
        'is_active_for_images' => true,
    ]);

    Prism::fake([ImageResponseFake::make()]);

    $response = $this->postJson(route('admin.media.generate'), [
        'prompt' => 'Un personaje de anime en la playa',
    ]);

    $response->assertOk()->assertJsonStructure(['run_id']);
    $runId = $response->json('run_id');

    $status = $this->getJson(route('admin.jobs.run-status', $runId));

    $status->assertOk()
        ->assertJsonPath('status', 'done')
        ->assertJsonPath('result.type', 'image');
});

test('generating narration audio queues a job and the run status endpoint reports it done', function () {
    AiProvider::factory()->create([
        'provider' => 'openai',
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        new AudioResponse(audio: new GeneratedAudio(base64: base64_encode('fake-mp3-bytes'), type: 'audio/mpeg')),
    ]);

    $article = NewsArticle::factory()->create();

    $response = $this->postJson(route('admin.news-articles.audio.generate', $article));

    $response->assertOk()->assertJsonStructure(['run_id']);
    $runId = $response->json('run_id');

    $status = $this->getJson(route('admin.jobs.run-status', $runId));

    $status->assertOk()
        ->assertJsonPath('status', 'done')
        ->assertJsonPath('result.type', 'audio');
});

test('accepting a cluster queues a job that creates the article', function () {
    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular de prueba
            RESUMEN: Un resumen de prueba.
            CUERPO: <p>Cuerpo de prueba.</p>
            CATEGORIA: gaming
            TAGS: tag1, tag2
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['status' => 'pending', 'category' => 'gaming']);

    $response = $this->postJson(route('admin.news-review.accept', $cluster));

    $response->assertOk()->assertJsonStructure(['run_id']);
    $runId = $response->json('run_id');

    $status = $this->getJson(route('admin.jobs.run-status', $runId));

    $status->assertOk()->assertJsonPath('status', 'done');

    $articleId = $status->json('result.article_id');
    expect($articleId)->not->toBeNull();
    expect(NewsArticle::find($articleId))->not->toBeNull();
    expect($cluster->fresh()->status)->toBe('accepted');
});

test('a lower ranked role cannot trigger these ai jobs', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');

    $article = NewsArticle::factory()->create();

    $this->actingAs($editor)
        ->postJson(route('admin.media.generate'), ['prompt' => 'x'])
        ->assertForbidden();

    $this->actingAs($editor)
        ->postJson(route('admin.news-articles.audio.generate', $article))
        ->assertForbidden();
});

test('generating images gets rate limited after 10 requests per minute', function () {
    Storage::fake('public');

    AiProvider::factory()->create([
        'provider' => 'openai',
        'api_key' => 'test-key',
        'is_active_for_images' => true,
    ]);

    Prism::fake([ImageResponseFake::make()]);

    for ($i = 0; $i < 10; $i++) {
        $this->postJson(route('admin.media.generate'), ['prompt' => "intento {$i}"])
            ->assertOk();
    }

    $this->postJson(route('admin.media.generate'), ['prompt' => 'intento 11'])
        ->assertStatus(429);
});
