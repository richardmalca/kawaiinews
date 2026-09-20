<?php

test('generates light apple splash screen image', function () {
    $response = $this->get(route('apple.splash', ['width' => 1170, 'height' => 2532, 'theme' => 'light']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'image/png');
    expect(strlen($response->getContent()))->toBeGreaterThan(100);
});

test('generates dark apple splash screen image', function () {
    $response = $this->get(route('apple.splash', ['width' => 1170, 'height' => 2532, 'theme' => 'dark']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'image/png');
    expect(strlen($response->getContent()))->toBeGreaterThan(100);
});

test('clamps splash dimensions safely', function () {
    $response = $this->get(route('apple.splash', ['width' => 50, 'height' => 5000, 'theme' => 'dark']));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'image/png');
});
