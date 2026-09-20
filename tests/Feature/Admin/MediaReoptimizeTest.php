<?php

use App\Models\Media;
use App\Models\NewsArticle;
use App\Services\Admin\MediaLibraryService;
use Illuminate\Support\Facades\Storage;

function makeOversizedPngContents(): string
{
    $image = imagecreatetruecolor(800, 600);
    imagefill($image, 0, 0, imagecolorallocate($image, 200, 50, 50));
    ob_start();
    imagepng($image);
    $contents = ob_get_clean();
    imagedestroy($image);

    return $contents;
}

test('reoptimizing an image replaces it with a new, smaller file and updates its url', function () {
    Storage::fake('public');

    $originalPath = 'media/img-old.webp';
    $original = makeOversizedPngContents();
    Storage::disk('public')->put($originalPath, $original);

    $media = Media::factory()->create([
        'type' => 'image',
        'url' => Storage::disk('public')->url($originalPath),
    ]);

    $result = app(MediaLibraryService::class)->reoptimizeAllImages();

    expect($result['reoptimized'])->toBe(1)
        ->and($result['failed'])->toBe(0)
        ->and($result['bytes_before'])->toBeGreaterThan(0)
        ->and($result['bytes_after'])->toBeLessThan($result['bytes_before']);

    $media->refresh();
    expect($media->url)->not->toBe(Storage::disk('public')->url($originalPath));
    Storage::disk('public')->assertMissing($originalPath);
});

test('a gif is skipped instead of being re-encoded (would break its animation)', function () {
    Storage::fake('public');

    $gif = imagecreate(50, 50);
    imagecolorallocate($gif, 255, 0, 0);
    ob_start();
    imagegif($gif);
    $gifContents = ob_get_clean();
    imagedestroy($gif);

    $originalPath = 'media/img-old.gif';
    Storage::disk('public')->put($originalPath, $gifContents);

    $media = Media::factory()->create([
        'type' => 'image',
        'url' => Storage::disk('public')->url($originalPath),
    ]);

    $result = app(MediaLibraryService::class)->reoptimizeAllImages();

    expect($result['reoptimized'])->toBe(0)
        ->and($result['skipped'])->toBe(1);

    expect($media->fresh()->url)->toBe(Storage::disk('public')->url($originalPath));
});

test('the media:reoptimize-images command reoptimizes images and syncs the article featured_image', function () {
    Storage::fake('public');

    $originalPath = 'media/img-old.webp';
    Storage::disk('public')->put($originalPath, makeOversizedPngContents());
    $url = Storage::disk('public')->url($originalPath);

    $article = NewsArticle::factory()->create(['featured_image' => $url]);
    Media::factory()->create(['type' => 'image', 'url' => $url, 'news_article_id' => $article->id]);

    $this->artisan('media:reoptimize-images')
        ->expectsOutputToContain('Reoptimizadas 1 imagen(es)')
        ->assertExitCode(0);

    expect($article->fresh()->featured_image)->not->toBe($url);
});
