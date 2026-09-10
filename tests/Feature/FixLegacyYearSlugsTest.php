<?php

use App\Models\NewsArticle;
use Illuminate\Support\Str;

test('it fixes a legacy slug that has the "ñ" bug', function () {
    $article = NewsArticle::factory()->create([
        'title' => 'Los mejores años del anime',
        'slug' => Str::slug('Los mejores años del anime'), // "los-mejores-anos-del-anime", el bug viejo
    ]);

    $this->artisan('app:fix-legacy-year-slugs')->assertSuccessful();

    expect($article->fresh()->slug)->toBe('los-mejores-anios-del-anime');
});

test('it does not touch a slug that was already customized and no longer matches the old algorithm', function () {
    $article = NewsArticle::factory()->create([
        'title' => 'Pretty Cure conquista el escenario',
        'slug' => 'precure-conquista-el-escenario', // título cambió después, slug quedó viejo por otra razón
    ]);

    $this->artisan('app:fix-legacy-year-slugs')->assertSuccessful();

    expect($article->fresh()->slug)->toBe('precure-conquista-el-escenario');
});

test('it does not touch articles without "ñ" in the title', function () {
    $article = NewsArticle::factory()->create([
        'title' => 'Nada que corregir aca',
        'slug' => 'nada-que-corregir-aca',
    ]);

    $this->artisan('app:fix-legacy-year-slugs')->assertSuccessful();

    expect($article->fresh()->slug)->toBe('nada-que-corregir-aca');
});

test('--dry-run reports what would change without saving anything', function () {
    $article = NewsArticle::factory()->create([
        'title' => 'Año Nuevo en el anime',
        'slug' => Str::slug('Año Nuevo en el anime'),
    ]);

    $this->artisan('app:fix-legacy-year-slugs --dry-run')
        ->expectsOutputToContain('anio-nuevo-en-el-anime')
        ->assertSuccessful();

    expect($article->fresh()->slug)->toBe(Str::slug('Año Nuevo en el anime'));
});
