<?php

use App\Models\NewsSource;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('the index page groups sources by category', function () {
    NewsSource::factory()->create(['category' => 'anime', 'label' => 'Fuente Anime']);
    NewsSource::factory()->create(['category' => 'gaming', 'label' => 'Fuente Gaming']);

    $this->get(route('admin.news-sources.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('groups')
            ->where('summary.total_sources', 2)
        );
});

test('a news source can be updated', function () {
    $source = NewsSource::factory()->create();

    $this->patch(route('admin.news-sources.update', $source), [
        'label' => 'Nuevo nombre',
        'url' => 'https://example.test',
        'rss_url' => 'https://example.test/feed',
    ])->assertRedirect(route('admin.news-sources.index'));

    expect($source->fresh())
        ->label->toBe('Nuevo nombre')
        ->url->toBe('https://example.test')
        ->rss_url->toBe('https://example.test/feed');
});

test('updating a news source validates required fields', function () {
    $source = NewsSource::factory()->create();

    $this->patch(route('admin.news-sources.update', $source), [
        'label' => '',
        'url' => 'not-a-url',
    ])->assertInvalid(['label', 'url']);
});

test('a news source can be toggled active/inactive', function () {
    $source = NewsSource::factory()->create(['is_active' => true]);

    $this->post(route('admin.news-sources.toggle', $source))
        ->assertRedirect(route('admin.news-sources.index'));
    expect($source->fresh()->is_active)->toBeFalse();

    $this->post(route('admin.news-sources.toggle', $source))
        ->assertRedirect(route('admin.news-sources.index'));
    expect($source->fresh()->is_active)->toBeTrue();
});

test('a news source can be deleted', function () {
    $source = NewsSource::factory()->create();

    $this->delete(route('admin.news-sources.destroy', $source))
        ->assertRedirect(route('admin.news-sources.index'));

    expect(NewsSource::find($source->id))->toBeNull();
});

test('all sources can be activated and deactivated in bulk', function () {
    NewsSource::factory()->count(3)->inactive()->create();

    $this->post(route('admin.news-sources.activate-all'))
        ->assertRedirect(route('admin.news-sources.index'));
    expect(NewsSource::where('is_active', true)->count())->toBe(3);

    $this->post(route('admin.news-sources.deactivate-all'))
        ->assertRedirect(route('admin.news-sources.index'));
    expect(NewsSource::where('is_active', true)->count())->toBe(0);
});

test('sources can be activated and deactivated by category', function () {
    NewsSource::factory()->inactive()->create(['category' => 'anime']);
    NewsSource::factory()->create(['category' => 'gaming', 'is_active' => true]);

    $this->post(route('admin.news-sources.category.activate', 'anime'))
        ->assertRedirect(route('admin.news-sources.index'));
    expect(NewsSource::where('category', 'anime')->first()->is_active)->toBeTrue();

    $this->post(route('admin.news-sources.category.deactivate', 'gaming'))
        ->assertRedirect(route('admin.news-sources.index'));
    expect(NewsSource::where('category', 'gaming')->first()->is_active)->toBeFalse();
});

test('activating or deactivating an unknown category is rejected', function () {
    $this->post(route('admin.news-sources.category.activate', 'no-existe'))
        ->assertNotFound();

    $this->post(route('admin.news-sources.category.deactivate', 'no-existe'))
        ->assertNotFound();
});

test('a lower ranked role cannot manage news sources', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor');
    $source = NewsSource::factory()->create();

    $this->actingAs($editor)
        ->get(route('admin.news-sources.index'))
        ->assertForbidden();

    $this->actingAs($editor)
        ->post(route('admin.news-sources.toggle', $source))
        ->assertForbidden();
});
