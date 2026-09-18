<?php

use App\Models\SiteSetting;

test('manifest.json reflects the configured site name and theme color', function () {
    SiteSetting::current()->update([
        'name' => 'Mi Sitio',
        'theme_color' => '#123456',
    ]);

    $response = $this->get('/manifest.json');

    $response->assertOk();
    $response->assertJson([
        'name' => 'Mi Sitio',
        'short_name' => 'Mi Sitio',
        'theme_color' => '#123456',
    ]);
});

test('manifest.json falls back to the static icons when no favicon was uploaded', function () {
    $response = $this->get('/manifest.json');

    $response->assertOk();
    $icons = $response->json('icons');

    expect($icons)->toHaveCount(3)
        ->and($icons[0]['src'])->toContain('android-chrome-192x192.png')
        ->and($icons[1]['src'])->toContain('android-chrome-512x512.png')
        ->and($icons[2]['src'])->toContain('apple-touch-icon.png');
});

test('manifest.json uses the uploaded favicon URLs once configured', function () {
    SiteSetting::current()->update([
        'favicon_192_path' => 'site/favicon-192.png',
        'favicon_512_path' => 'site/favicon-512.png',
        'apple_touch_icon_path' => 'site/apple-touch-icon.png',
    ]);

    $response = $this->get('/manifest.json');

    $icons = $response->json('icons');

    expect($icons[0]['src'])->toContain('site/favicon-192.png')
        ->and($icons[1]['src'])->toContain('site/favicon-512.png')
        ->and($icons[2]['src'])->toContain('site/apple-touch-icon.png');
});
