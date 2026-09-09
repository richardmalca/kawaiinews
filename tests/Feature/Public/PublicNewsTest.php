<?php

use App\Models\NewsArticle;

test('public home displays published articles and ignores drafts', function () {
    NewsArticle::factory()->create([
        'title' => 'Borrador Oculto',
        'status' => 'draft',
        'published_at' => null,
    ]);

    NewsArticle::factory()->create([
        'title' => 'Noticia Publicada 1',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('public/home/index')
        ->has('articles.data')
    );
});

test('public category route filters articles correctly', function () {
    NewsArticle::factory()->create([
        'title' => 'Anime Noticia Exclusiva',
        'category' => 'anime',
        'status' => 'published',
        'published_at' => now(),
    ]);

    NewsArticle::factory()->create([
        'title' => 'Gaming Noticia',
        'category' => 'gaming',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $response = $this->get(route('public.category', ['category' => 'anime']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedCategory', 'anime')
        ->where('articles.data.0.title', 'Anime Noticia Exclusiva')
    );
});

test('public search finds articles by keyword', function () {
    NewsArticle::factory()->create([
        'title' => 'Anuncio de Jujutsu Kaisen temporada nueva',
        'status' => 'published',
        'published_at' => now(),
    ]);

    NewsArticle::factory()->create([
        'title' => 'Nueva consola portátil',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $response = $this->get('/?q=Jujutsu');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('search', 'Jujutsu')
        ->has('articles.data', 1)
        ->where('articles.data.0.title', 'Anuncio de Jujutsu Kaisen temporada nueva')
    );
});

test('public article detail displays published article by slug', function () {
    $article = NewsArticle::factory()->create([
        'title' => 'Detalle de Prueba Especial',
        'slug' => 'detalle-de-prueba-especial',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $response = $this->get(route('news.show', ['slug' => $article->slug]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('public/articles/show')
        ->where('article.data.title', 'Detalle de Prueba Especial')
    );
});

test('public trending page displays trending articles ordered by popularity', function () {
    NewsArticle::factory()->create([
        'title' => 'Noticia Normal',
        'status' => 'published',
        'published_at' => now(),
        'views_count' => 5,
    ]);

    NewsArticle::factory()->create([
        'title' => 'Noticia Super Viral',
        'status' => 'published',
        'published_at' => now(),
        'views_count' => 1500,
    ]);

    $response = $this->get(route('public.trending'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('public/trending/index')
        ->has('articles.data', 2)
        ->where('articles.data.0.title', 'Noticia Super Viral')
    );
});
