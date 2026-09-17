<?php

use App\Models\AiProvider;
use App\Models\NewsArticle;
use App\Models\NewsCluster;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

function fakeDraftResponse(): TextResponseFake
{
    return TextResponseFake::make()->withText(<<<'TXT'
        TITULO: Un titular de prueba
        RESUMEN: Un resumen de prueba.
        CUERPO: <p>Cuerpo de prueba.</p>
        CATEGORIA: anime
        TAGS:
        TXT);
}

test('it does nothing when auto-accept is off', function () {
    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish']);

    $this->artisan('news:auto-accept')
        ->expectsOutputToContain('Noticias aceptadas automáticamente: 0')
        ->assertExitCode(0);

    expect(NewsArticle::count())->toBe(0);
});

test('each run only accepts the single best publish-verdict cluster, never the whole daily limit at once', function () {
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    SiteSetting::current()->update(['auto_accept_news_enabled' => true, 'auto_accept_news_daily_limit' => 2]);

    $low = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish', 'relevance_score' => 10]);
    $mid = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish', 'relevance_score' => 50]);
    $high = NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'publish', 'relevance_score' => 90]);

    Prism::fake([fakeDraftResponse()]);

    $this->artisan('news:auto-accept')
        ->expectsOutputToContain('Noticias aceptadas automáticamente: 1')
        ->assertExitCode(0);

    expect($high->fresh()->status)->toBe('accepted')
        ->and($mid->fresh()->status)->toBe('pending')
        ->and($low->fresh()->status)->toBe('pending');

    // Se acepta y se publica sola: la decisión de aceptar el cluster ya
    // implica publicarlo, sin que el admin tenga que entrar a apretar
    // "Publicar" a mano (ver PublishArticleWhenReadyJob).
    expect(NewsArticle::where('status', 'published')->count())->toBe(1);
});

test('it stops for the day once the daily limit is reached across separate runs', function () {
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    SiteSetting::current()->update(['auto_accept_news_enabled' => true, 'auto_accept_news_daily_limit' => 2]);

    NewsCluster::factory()->count(3)->create(['status' => 'pending', 'ai_verdict' => 'publish']);

    Prism::fake([fakeDraftResponse(), fakeDraftResponse()]);

    $this->artisan('news:auto-accept')->expectsOutputToContain('Noticias aceptadas automáticamente: 1');
    $this->artisan('news:auto-accept')->expectsOutputToContain('Noticias aceptadas automáticamente: 1');
    $this->artisan('news:auto-accept')->expectsOutputToContain('Noticias aceptadas automáticamente: 0');

    expect(NewsCluster::where('status', 'accepted')->count())->toBe(2)
        ->and(NewsCluster::where('status', 'pending')->count())->toBe(1);
});

test('it does not touch clusters that are not marked publish', function () {
    AiProvider::factory()->create(['provider' => 'anthropic', 'is_active' => true, 'api_key' => 'test-key']);
    SiteSetting::current()->update(['auto_accept_news_enabled' => true, 'auto_accept_news_daily_limit' => 5]);

    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => 'discard']);
    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);

    $this->artisan('news:auto-accept')
        ->expectsOutputToContain('Noticias aceptadas automáticamente: 0')
        ->assertExitCode(0);
});

test('a superadmin can toggle auto-accept and set the daily limit', function () {
    $this->seed(RoleSeeder::class);
    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);

    $this->post(route('admin.news-review.toggle-auto-accept'), ['enabled' => true, 'daily_limit' => 3])
        ->assertRedirect();

    $settings = SiteSetting::current();
    expect($settings->auto_accept_news_enabled)->toBeTrue()
        ->and($settings->auto_accept_news_daily_limit)->toBe(3);
});
