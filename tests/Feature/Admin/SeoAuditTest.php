<?php

use App\Models\ActivityLog;
use App\Models\AiProvider;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Http;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('superadmin');
    $this->actingAs($admin);
});

test('the seo audit fetches the real homepage and returns a checklist', function () {
    Http::fake([
        url('/') => Http::response(
            '<html><head><title>Kawaii News</title>'
            .'<meta name="description" content="Una descripción corta">'
            .'<link rel="canonical" href="https://kawaiinews.test/">'
            .'<meta property="og:image" content="https://kawaiinews.test/og.png">'
            .'<script type="application/ld+json">{}</script>'
            .'</head><body></body></html>',
            200,
        ),
    ]);

    $response = $this->postJson(route('admin.site-settings.seo-audit'));

    $response->assertOk();
    $response->assertJsonPath('tags.title', 'Kawaii News');
    $response->assertJsonPath('tags.description', 'Una descripción corta');
    $response->assertJsonCount(9, 'checks');
});

test('the seo audit reports an error when the homepage cannot be reached', function () {
    Http::fake([
        url('/') => Http::response('Server error', 500),
    ]);

    $response = $this->postJson(route('admin.site-settings.seo-audit'));

    $response->assertOk();
    expect($response->json('error'))->not->toBeNull();
});

test('the seo audit includes an ai review when a text provider is active', function () {
    Http::fake([
        url('/') => Http::response('<html><head><title>T</title></head></html>', 200),
    ]);

    AiProvider::factory()->create(['is_active' => true, 'api_key' => 'test-key']);
    Prism::fake([TextResponseFake::make()->withText('Todo bien, mejorá la descripción.')]);

    $response = $this->postJson(route('admin.site-settings.seo-audit'));

    $response->assertOk();
    expect($response->json('ai_review'))->toBe('Todo bien, mejorá la descripción.');
});

test('a superadmin can toggle the google search box', function () {
    $response = $this->post(route('admin.site-settings.search-box.update'), ['enabled' => true]);

    $response->assertRedirect();
    expect(SiteSetting::current()->search_box_enabled)->toBeTrue();
    expect(ActivityLog::where('action', 'site_settings.search_box_toggled')->exists())->toBeTrue();
});

test('the WebSite/SearchAction schema only renders on the homepage when the search box is enabled', function () {
    SiteSetting::current()->update(['search_box_enabled' => false]);
    $this->get('/')->assertDontSee('SearchAction', false);

    SiteSetting::current()->update(['search_box_enabled' => true]);
    $this->get('/')->assertSee('SearchAction', false);
});
