<?php

use App\Models\NewsArticle;
use App\Models\Tag;

test('public tag route displays published articles associated with tag', function () {
    $tag = Tag::create([
        'name' => 'Re:Zero',
        'slug' => 'rezero',
    ]);

    $article = NewsArticle::factory()->create([
        'title' => 'Re:Zero Temporada 3 Confirmada',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $article->tags()->attach($tag);

    $draftArticle = NewsArticle::factory()->create([
        'title' => 'Re:Zero Noticia en Borrador',
        'status' => 'draft',
        'published_at' => null,
    ]);
    $draftArticle->tags()->attach($tag);

    $otherArticle = NewsArticle::factory()->create([
        'title' => 'Otra Noticia Diferente',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $response = $this->get(route('public.tag', ['tag' => 'rezero']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('public/tag/show')
        ->where('tag.name', 'Re:Zero')
        ->where('tag.slug', 'rezero')
        ->has('articles.data', 1)
        ->where('articles.data.0.title', 'Re:Zero Temporada 3 Confirmada')
    );
});

test('public tag route returns 404 for nonexistent tag', function () {
    $response = $this->get('/tag/etiqueta-inexistente');

    $response->assertNotFound();
});

test('search suggestions endpoint includes matching tags', function () {
    $tag = Tag::create([
        'name' => 'Naruto',
        'slug' => 'naruto',
    ]);

    $article = NewsArticle::factory()->create([
        'title' => 'Noticia de Naruto Shippuden',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $article->tags()->attach($tag);

    $response = $this->getJson(route('public.search.suggestions', ['q' => 'naru']));

    $response->assertOk();
    $response->assertJsonFragment([
        'name' => 'Naruto',
        'slug' => 'naruto',
    ]);
});
