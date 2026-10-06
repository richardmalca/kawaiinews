<?php

use App\Models\AiProvider;
use App\Models\Media;
use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Models\ScrapedItem;
use App\Services\Admin\MediaLibraryService;
use App\Services\Admin\NewsArticleService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

function fakeSourceImageDraftResponse(): void
{
    Prism::fake([
        TextResponseFake::make()->withText(<<<'TXT'
            TITULO: Un titular
            RESUMEN: Un resumen.
            CUERPO: <p>Primer párrafo de la noticia.</p><p>Segundo párrafo con más contexto.</p>
            CATEGORIA: anime
            TAGS: uno, dos
            TXT),
    ]);
}

test('downloadAndStore descarga los bytes y los sube a nuestro propio disco, sin hotlinkear', function () {
    Storage::fake('public');
    Http::fake(['source.test/*' => Http::response('fake-bytes', 200, ['Content-Type' => 'image/jpeg'])]);

    $media = app(MediaLibraryService::class)->downloadAndStore('https://source.test/foto.jpg');

    expect($media)->not->toBeNull()
        ->and($media->source)->toBe('url')
        ->and($media->url)->not->toContain('source.test');
});

test('downloadAndStore devuelve null sin romper nada si la descarga falla', function () {
    Http::fake(['source.test/*' => Http::response('', 500)]);

    $media = app(MediaLibraryService::class)->downloadAndStore('https://source.test/foto.jpg');

    expect($media)->toBeNull();
});

test('createFromCluster usa la foto oficial de la fuente como portada, la inserta chica en el cuerpo con leyenda, y la marca como no-IA', function () {
    Storage::fake('public');
    Http::fake(['source.test/*' => Http::response('fake-bytes', 200, ['Content-Type' => 'image/jpeg'])]);
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    fakeSourceImageDraftResponse();

    $source = NewsSource::factory()->create(['label' => 'Crunchyroll News']);
    $cluster = NewsCluster::factory()->create(['category' => 'anime', 'image_url' => 'https://source.test/foto.jpg']);
    ScrapedItem::factory()->create([
        'news_cluster_id' => $cluster->id,
        'news_source_id' => $source->id,
        'image_url' => 'https://source.test/foto.jpg',
    ]);

    $article = app(NewsArticleService::class)->createFromCluster($cluster->fresh());

    expect($article->featured_image)->not->toBeNull()
        ->and($article->featured_image)->not->toContain('source.test')
        ->and($article->featured_image_source)->toBe('url')
        ->and($article->body)->toContain('source-figure')
        ->and($article->body)->toContain('Imagen: Crunchyroll News')
        ->and($article->body)->toContain('Primer párrafo de la noticia.');

    expect(Media::where('news_article_id', $article->id)->where('source', 'url')->exists())->toBeTrue();
});

test('createFromCluster no toca el cuerpo ni la portada cuando el cluster no tiene imagen de fuente', function () {
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    fakeSourceImageDraftResponse();

    $cluster = NewsCluster::factory()->create(['category' => 'anime', 'image_url' => null]);

    $article = app(NewsArticleService::class)->createFromCluster($cluster);

    expect($article->featured_image)->toBeNull()
        ->and($article->featured_image_source)->toBeNull()
        ->and($article->body)->not->toContain('source-figure');
});
