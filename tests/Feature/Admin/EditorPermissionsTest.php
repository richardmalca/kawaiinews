<?php

use App\Models\Media;
use App\Models\NewsArticle;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('an editor can view, create and edit news articles, but not delete them', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');
    $article = NewsArticle::factory()->create();

    $this->actingAs($editor)->get(route('admin.news-articles.index'))->assertOk();
    $this->actingAs($editor)->get(route('admin.news-articles.create'))->assertOk();
    $this->actingAs($editor)->get(route('admin.news-articles.edit', $article))->assertOk();

    $this->actingAs($editor)
        ->put(route('admin.news-articles.update', $article), [
            'title' => 'Actualizado por un editor',
            'slug' => $article->slug,
            'category' => $article->category,
            'excerpt' => 'Resumen',
            'body' => '<p>Cuerpo</p>',
            'status' => 'draft',
            'tags' => [],
        ])
        ->assertRedirect();

    expect($article->fresh()->title)->toBe('Actualizado por un editor');

    $this->actingAs($editor)
        ->delete(route('admin.news-articles.destroy', $article))
        ->assertForbidden();

    $this->assertModelExists($article);
});

test('an editor can access the media library and upload media, but not delete it', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');
    $media = Media::factory()->create();

    $this->actingAs($editor)->get(route('admin.media.index'))->assertOk();
    $this->actingAs($editor)->get(route('admin.media-library.index'))->assertOk();
    $this->actingAs($editor)->get(route('admin.audio.index'))->assertOk();

    $this->actingAs($editor)
        ->delete(route('admin.media.destroy', $media))
        ->assertForbidden();

    $this->assertModelExists($media);
});

test('an editor can see their own KPI page but not the site-wide configuration pages', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');

    $this->actingAs($editor)->get(route('admin.my-articles.index'))->assertOk();

    $this->actingAs($editor)->get(route('admin.ai-providers.index'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.news-sources.index'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.news-review.index'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.storage-settings.edit'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.site-settings.edit'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.backup.index'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.activity-log.index'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.comments.index'))->assertForbidden();
    $this->actingAs($editor)->get(route('admin.users.index'))->assertForbidden();
});

test('my-articles only reports the stats of the logged-in author, not everyone else\'s', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');
    $other = User::factory()->create();

    NewsArticle::factory()->create(['author_id' => $editor->id, 'views_count' => 10]);
    NewsArticle::factory()->create(['author_id' => $other->id, 'views_count' => 999]);

    $response = $this->actingAs($editor)->get(route('admin.my-articles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('articles', 1)
        ->where('totals.articles', 1)
        ->where('totals.views', 10)
    );
});
