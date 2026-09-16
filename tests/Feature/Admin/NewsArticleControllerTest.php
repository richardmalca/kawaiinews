<?php

use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Models\ScrapedItem;
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

test('articles index exposes whether each article has image, audio, trailer, and its original references', function () {
    $source = NewsSource::factory()->create(['label' => 'Anime News Network']);
    $cluster = NewsCluster::factory()->create(['video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    ScrapedItem::factory()->create([
        'news_cluster_id' => $cluster->id,
        'news_source_id' => $source->id,
        'title' => 'Fuente original',
        'url' => 'https://ann.test/noticia',
    ]);

    $article = NewsArticle::factory()->create([
        'news_cluster_id' => $cluster->id,
        'featured_image' => 'https://example.test/portada.webp',
        'audio_url' => 'https://example.test/narracion.mp3',
    ]);

    $response = $this->get(route('admin.news-articles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('articles.0.id', $article->id)
        ->where('articles.0.has_image', true)
        ->where('articles.0.has_audio', true)
        ->where('articles.0.has_video', true)
        ->where('articles.0.references.0.url', 'https://ann.test/noticia')
        ->where('articles.0.references.0.source_label', 'Anime News Network')
    );
});

test('a manually created article without a cluster has no references and no trailer', function () {
    NewsArticle::factory()->create(['news_cluster_id' => null, 'featured_image' => null, 'audio_url' => null]);

    $response = $this->get(route('admin.news-articles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('articles.0.has_image', false)
        ->where('articles.0.has_audio', false)
        ->where('articles.0.has_video', false)
        ->where('articles.0.references', [])
    );
});

test('articles index exposes kpis: total, published, drafts, without image and this week', function () {
    NewsArticle::factory()->published()->create(['featured_image' => 'https://example.test/a.png', 'created_at' => now()]);
    NewsArticle::factory()->published()->create(['featured_image' => null, 'created_at' => now()->subDays(20)]);
    NewsArticle::factory()->create(['status' => 'draft', 'featured_image' => null, 'created_at' => now()]);

    $response = $this->get(route('admin.news-articles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('kpis.total', 3)
        ->where('kpis.published', 2)
        ->where('kpis.drafts', 1)
        ->where('kpis.without_image', 2)
        ->where('kpis.this_week', 2)
    );
});

test('kpis are scoped to the active category filter', function () {
    NewsArticle::factory()->count(2)->create(['category' => 'anime']);
    NewsArticle::factory()->count(5)->create(['category' => 'geek']);

    $response = $this->get(route('admin.news-articles.index', ['category' => 'anime']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->where('kpis.total', 2));
});

test('articles index kpis include how many are missing image and how many are missing audio', function () {
    NewsArticle::factory()->create(['featured_image' => null, 'audio_url' => null]);
    NewsArticle::factory()->create(['featured_image' => 'https://example.test/a.png', 'audio_url' => null]);
    NewsArticle::factory()->create(['featured_image' => 'https://example.test/b.png', 'audio_url' => 'https://example.test/a.mp3']);

    $response = $this->get(route('admin.news-articles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('kpis.without_image', 1)
        ->where('kpis.without_audio', 2)
    );
});

test('articles index can be filtered to only those missing an image or missing audio', function () {
    $noImage = NewsArticle::factory()->create(['featured_image' => null, 'audio_url' => 'https://example.test/a.mp3']);
    $noAudio = NewsArticle::factory()->create(['featured_image' => 'https://example.test/a.png', 'audio_url' => null]);
    NewsArticle::factory()->create(['featured_image' => 'https://example.test/b.png', 'audio_url' => 'https://example.test/b.mp3']);

    $this->get(route('admin.news-articles.index', ['missing' => 'image']))
        ->assertInertia(fn ($page) => $page
            ->has('articles', 1)
            ->where('articles.0.id', $noImage->id)
            ->where('missing', 'image')
        );

    $this->get(route('admin.news-articles.index', ['missing' => 'audio']))
        ->assertInertia(fn ($page) => $page
            ->has('articles', 1)
            ->where('articles.0.id', $noAudio->id)
            ->where('missing', 'audio')
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

test('articles index can be searched by title', function () {
    NewsArticle::factory()->create(['title' => 'Se anuncia la temporada 2 de Frieren']);
    NewsArticle::factory()->create(['title' => 'Nuevo tráiler de Chainsaw Man']);

    $response = $this->get(route('admin.news-articles.index', ['search' => 'frieren']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('articles', 1)
        ->where('search', 'frieren')
        ->where('articles.0.title', 'Se anuncia la temporada 2 de Frieren')
    );
});

test('the create form renders with the category catalog and available tags', function () {
    $response = $this->get(route('admin.news-articles.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('categories')
        ->has('availableTags')
    );
});

test('a superadmin can manually create a news article', function () {
    $response = $this->post(route('admin.news-articles.store'), [
        'title' => 'Se anuncia la segunda temporada',
        'category' => 'anime',
        'excerpt' => 'Un resumen corto.',
        'body' => '<p>Cuerpo de la noticia.</p>',
        'status' => 'published',
        'tags' => ['anuncio', 'segunda-temporada'],
    ]);

    $article = NewsArticle::where('title', 'Se anuncia la segunda temporada')->firstOrFail();

    $response->assertRedirect(route('admin.news-articles.edit', $article));

    expect($article->slug)->toBe('se-anuncia-la-segunda-temporada')
        ->and($article->status)->toBe('published')
        ->and($article->published_at)->not->toBeNull()
        ->and($article->news_cluster_id)->toBeNull()
        ->and($article->author_id)->toBe(auth()->id())
        ->and($article->tags->pluck('name')->all())->toBe(['anuncio', 'segunda-temporada']);
});

test('manually creating an article with a duplicate slug gets a unique suffix', function () {
    NewsArticle::factory()->create(['slug' => 'mismo-titulo']);

    $this->post(route('admin.news-articles.store'), [
        'title' => 'Mismo título',
        'category' => 'anime',
        'status' => 'draft',
    ])->assertRedirect();

    expect(NewsArticle::where('slug', 'mismo-titulo-1')->exists())->toBeTrue();
});

test('creating an article requires a title and a valid category', function () {
    $this->post(route('admin.news-articles.store'), [
        'title' => '',
        'category' => 'not-a-real-category',
        'status' => 'draft',
    ])->assertInvalid(['title', 'category']);
});

test('slugs replace "ñ" with "ni" instead of dropping it into "n" (regression: "años" must not become "anos")', function () {
    $this->post(route('admin.news-articles.store'), [
        'title' => 'Los mejores años del anime',
        'category' => 'anime',
        'status' => 'draft',
        'tags' => ['año nuevo'],
    ])->assertRedirect();

    $article = NewsArticle::where('title', 'Los mejores años del anime')->firstOrFail();

    expect($article->slug)->toBe('los-mejores-anios-del-anime')
        ->and($article->slug)->not->toContain('anos')
        ->and($article->tags->first()->slug)->toBe('anio-nuevo');
});

test('an explicit slug typed by the admin also gets the "ñ" fix', function () {
    $article = NewsArticle::factory()->create();

    $this->put(route('admin.news-articles.update', $article), [
        'title' => $article->title,
        'category' => $article->category,
        'status' => $article->status,
        'slug' => 'edición-años-90',
    ])->assertRedirect();

    expect($article->fresh()->slug)->toBe('edicion-anios-90');
});
