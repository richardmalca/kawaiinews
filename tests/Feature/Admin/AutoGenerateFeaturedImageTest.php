<?php

use App\Jobs\GenerateArticleFeaturedImageJob;
use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\User;
use App\Services\Admin\MediaLibraryService;
use App\Services\Admin\NewsArticleService;
use App\Support\ArticleImagePromptBuilder;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\ImageResponseFake;
use Prism\Prism\Testing\TextResponseFake;

test('ArticleImagePromptBuilder returns null until title, excerpt and body are all filled', function () {
    $article = NewsArticle::factory()->make(['title' => '', 'excerpt' => null, 'body' => null]);

    expect(ArticleImagePromptBuilder::build($article))->toBeNull();
});

test('ArticleImagePromptBuilder builds a textless prompt mentioning the title and category style', function () {
    $article = NewsArticle::factory()->make([
        'title' => 'Un titular de prueba',
        'excerpt' => 'Un resumen de prueba',
        'body' => '<p>Cuerpo de la noticia.</p>',
        'category' => 'gaming',
    ]);

    $prompt = ArticleImagePromptBuilder::build($article);

    expect($prompt)
        ->toContain('Un titular de prueba')
        ->toContain('completely textless')
        ->toContain('video game promotional concept art');
});

test('createFromCluster dispatches the auto-generate job only when enabled and the cluster has a source image', function () {
    Queue::fake();

    AiProvider::factory()->create([
        'provider' => 'anthropic',
        'is_active' => true,
        'api_key' => 'test-key',
    ]);
    AiProvider::factory()->create([
        'provider' => 'gemini',
        'is_active_for_images' => true,
        'auto_generate_featured_image' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular
            RESUMEN: Un resumen.
            CUERPO: <p>Cuerpo.</p>
            CATEGORIA: gaming
            TAGS:
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['category' => 'gaming', 'image_url' => 'https://source.test/foto.jpg']);

    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    Queue::assertPushed(GenerateArticleFeaturedImageJob::class, fn ($job) => $job->newsArticleId === $article->id);
});

test('createFromCluster does not dispatch the job when auto-generate is off', function () {
    Queue::fake();

    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create([
        'provider' => 'gemini',
        'is_active_for_images' => true,
        'auto_generate_featured_image' => false,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular
            RESUMEN: Un resumen.
            CUERPO: <p>Cuerpo.</p>
            CATEGORIA: gaming
            TAGS:
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['category' => 'gaming', 'image_url' => 'https://source.test/foto.jpg']);
    app(NewsArticleService::class)->createFromCluster($cluster);

    Queue::assertNotPushed(GenerateArticleFeaturedImageJob::class);
});

test('createFromCluster does not dispatch the job when the cluster has no source image', function () {
    Queue::fake();

    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    AiProvider::factory()->create([
        'provider' => 'gemini',
        'is_active_for_images' => true,
        'auto_generate_featured_image' => true,
        'api_key' => 'test-key',
    ]);

    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular
            RESUMEN: Un resumen.
            CUERPO: <p>Cuerpo.</p>
            CATEGORIA: gaming
            TAGS:
            TXT),
    ]);

    $cluster = NewsCluster::factory()->create(['category' => 'gaming', 'image_url' => null]);
    app(NewsArticleService::class)->createFromCluster($cluster);

    Queue::assertNotPushed(GenerateArticleFeaturedImageJob::class);
});

test('generateFeaturedImage replaces the raw source image with an AI image referencing it', function () {
    Storage::fake('public');

    AiProvider::factory()->create(['provider' => 'gemini', 'api_key' => 'test-key', 'is_active_for_images' => true]);
    Prism::fake([ImageResponseFake::make()]);

    $cluster = NewsCluster::factory()->create(['image_url' => 'https://source.test/foto.jpg']);
    $article = NewsArticle::factory()->create([
        'news_cluster_id' => $cluster->id,
        'title' => 'Un titular',
        'excerpt' => 'Un resumen',
        'body' => '<p>Cuerpo de la noticia.</p>',
        'featured_image' => $cluster->image_url,
    ]);

    $media = app(MediaLibraryService::class)->generateFeaturedImage($article);

    expect($media)->not->toBeNull()
        ->and($media->news_article_id)->toBe($article->id)
        ->and($media->source)->toBe('ai');

    expect($article->fresh()->featured_image)->toBe($media->url)
        ->not->toBe($cluster->image_url);
});

test('generateFeaturedImage does nothing when the featured image was already changed by hand', function () {
    AiProvider::factory()->create(['provider' => 'gemini', 'api_key' => 'test-key', 'is_active_for_images' => true]);

    $cluster = NewsCluster::factory()->create(['image_url' => 'https://source.test/foto.jpg']);
    $article = NewsArticle::factory()->create([
        'news_cluster_id' => $cluster->id,
        'title' => 'Un titular',
        'excerpt' => 'Un resumen',
        'body' => '<p>Cuerpo de la noticia.</p>',
        'featured_image' => 'https://otra.test/elegida-a-mano.webp',
    ]);

    $media = app(MediaLibraryService::class)->generateFeaturedImage($article);

    expect($media)->toBeNull();
    expect(Media::where('news_article_id', $article->id)->count())->toBe(0);
    expect($article->fresh()->featured_image)->toBe('https://otra.test/elegida-a-mano.webp');
});

test('generateFeaturedImage does nothing when the article content is still incomplete', function () {
    $cluster = NewsCluster::factory()->create(['image_url' => 'https://source.test/foto.jpg']);
    $article = NewsArticle::factory()->create([
        'news_cluster_id' => $cluster->id,
        'excerpt' => '',
        'body' => '',
        'featured_image' => $cluster->image_url,
    ]);

    $media = app(MediaLibraryService::class)->generateFeaturedImage($article);

    expect($media)->toBeNull();
});

test('a superadmin can toggle auto-generate featured image for a provider', function () {
    $this->seed(RoleSeeder::class);
    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);

    $provider = AiProvider::factory()->create(['provider' => 'gemini', 'is_active_for_images' => true]);

    $this->post(route('admin.ai-providers.toggle-auto-generate-featured-image', $provider), ['enabled' => true])
        ->assertRedirect();

    expect($provider->fresh()->auto_generate_featured_image)->toBeTrue();
});
