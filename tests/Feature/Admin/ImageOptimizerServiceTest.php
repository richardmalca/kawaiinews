<?php

use App\Services\Admin\ImageOptimizerService;

function makePngContents(int $width, int $height): string
{
    $image = imagecreatetruecolor($width, $height);
    imagefill($image, 0, 0, imagecolorallocate($image, 200, 50, 50));
    ob_start();
    imagepng($image);
    $contents = ob_get_clean();
    imagedestroy($image);

    return $contents;
}

test('a small image is converted to webp without resizing', function () {
    $service = new ImageOptimizerService;
    $original = makePngContents(200, 100);

    $webp = $service->optimize($original, 'image/png');

    expect($webp)->not->toBeNull();

    $image = imagecreatefromstring($webp);
    expect(imagesx($image))->toBe(200)
        ->and(imagesy($image))->toBe(100);
});

test('an oversized image is resized down to the max dimension, keeping aspect ratio', function () {
    $service = new ImageOptimizerService;
    $original = makePngContents(4000, 2000);

    $webp = $service->optimize($original, 'image/png');
    $image = imagecreatefromstring($webp);

    expect(imagesx($image))->toBe(1920)
        ->and(imagesy($image))->toBe(960);
});

test('a webp result is meaningfully smaller than an uncompressed png of the same image', function () {
    $service = new ImageOptimizerService;
    $original = makePngContents(800, 600);

    $webp = $service->optimize($original, 'image/png');

    expect(strlen($webp))->toBeLessThan(strlen($original));
});

test('gifs are left untouched to avoid breaking animation', function () {
    $service = new ImageOptimizerService;

    $gif = imagecreate(50, 50);
    imagecolorallocate($gif, 255, 0, 0);
    ob_start();
    imagegif($gif);
    $gifContents = ob_get_clean();
    imagedestroy($gif);

    expect($service->optimize($gifContents, 'image/gif'))->toBeNull();
});

test('garbage input returns null instead of throwing', function () {
    $service = new ImageOptimizerService;

    expect($service->optimize('not an image', 'image/png'))->toBeNull();
});
