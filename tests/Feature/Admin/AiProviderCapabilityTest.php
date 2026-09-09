<?php

use App\Models\AiProvider;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('a provider can be activated for images independently of text', function () {
    $openai = AiProvider::factory()->create(['provider' => 'openai', 'is_active' => true]);
    $anthropic = AiProvider::factory()->create(['provider' => 'anthropic']);

    $this->post(route('admin.ai-providers.activate', $openai), ['capability' => 'image']);

    $openai->refresh();
    $anthropic->refresh();

    expect($openai->is_active)->toBeTrue()
        ->and($openai->is_active_for_images)->toBeTrue()
        ->and($anthropic->is_active)->toBeFalse();
});

test('a provider that does not support images cannot be activated for images', function () {
    $anthropic = AiProvider::factory()->create(['provider' => 'anthropic']);

    $this->post(route('admin.ai-providers.activate', $anthropic), ['capability' => 'image']);

    expect($anthropic->refresh()->is_active_for_images)->toBeFalse();
});

test('activating a second provider for images deactivates the previous one', function () {
    $openai = AiProvider::factory()->create(['provider' => 'openai', 'is_active_for_images' => true]);
    $gemini = AiProvider::factory()->create(['provider' => 'gemini', 'label' => 'Google Gemini']);

    $this->post(route('admin.ai-providers.activate', $gemini), ['capability' => 'image']);

    expect($openai->refresh()->is_active_for_images)->toBeFalse()
        ->and($gemini->refresh()->is_active_for_images)->toBeTrue();
});

test('the catalog exposes which providers support images and audio', function () {
    $response = $this->get(route('admin.ai-providers.index'));

    $response->assertInertia(fn ($page) => $page
        ->where('catalog', fn ($catalog) => collect($catalog)
            ->firstWhere('provider', 'openai')['supports_image'] === true
            && collect($catalog)->firstWhere('provider', 'openai')['supports_audio'] === true
            && collect($catalog)->firstWhere('provider', 'anthropic')['supports_image'] === false
        )
    );
});

test('a provider whose api_key cannot be decrypted (e.g. imported under a different APP_KEY) does not crash the index page', function () {
    $provider = AiProvider::factory()->create(['provider' => 'openai']);

    DB::table('ai_providers')->where('id', $provider->id)->update([
        'api_key' => 'esto-no-es-un-valor-encriptado-valido',
    ]);

    $response = $this->get(route('admin.ai-providers.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('providers.0.has_api_key', false)
    );

    expect($provider->fresh()->hasApiKey())->toBeFalse();
});
