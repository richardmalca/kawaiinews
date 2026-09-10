<?php

use App\Models\NewsArticle;

test('it replaces <u> with <strong> in articles that have it', function () {
    $article = NewsArticle::factory()->create([
        'body' => '<p>Texto normal.</p><p>Este es <u>el dato más importante</u> de la noticia.</p>',
    ]);

    $this->artisan('app:fix-underline-emphasis')->assertSuccessful();

    expect($article->fresh()->body)
        ->toBe('<p>Texto normal.</p><p>Este es <strong>el dato más importante</strong> de la noticia.</p>')
        ->not->toContain('<u>')
        ->not->toContain('</u>');
});

test('it handles multiple <u> occurrences in the same article', function () {
    $article = NewsArticle::factory()->create([
        'body' => '<p><u>Primero</u></p><p><u>Segundo</u></p>',
    ]);

    $this->artisan('app:fix-underline-emphasis')->assertSuccessful();

    expect($article->fresh()->body)->toBe('<p><strong>Primero</strong></p><p><strong>Segundo</strong></p>');
});

test('it does not touch articles without <u>', function () {
    $article = NewsArticle::factory()->create([
        'body' => '<p><strong>Nada que cambiar</strong> acá.</p>',
    ]);

    $this->artisan('app:fix-underline-emphasis')->assertSuccessful();

    expect($article->fresh()->body)->toBe('<p><strong>Nada que cambiar</strong> acá.</p>');
});

test('--dry-run reports what would change without saving anything', function () {
    $article = NewsArticle::factory()->create([
        'body' => '<p><u>Dato clave</u></p>',
    ]);

    $this->artisan('app:fix-underline-emphasis --dry-run')
        ->expectsOutputToContain((string) $article->id)
        ->assertSuccessful();

    expect($article->fresh()->body)->toBe('<p><u>Dato clave</u></p>');
});
