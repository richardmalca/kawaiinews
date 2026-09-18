<?php

use App\Models\NewsArticle;
use App\Models\User;
use App\Notifications\NewArticlePublishedNotification;
use Illuminate\Support\Facades\Notification;

test('it sends the top 3 most viewed recent articles to every user, even ones who follow nothing', function () {
    Notification::fake();

    $users = User::factory()->count(3)->create();

    $top = NewsArticle::factory()->published()->create(['views_count' => 500, 'published_at' => now()->subDays(2)]);
    $second = NewsArticle::factory()->published()->create(['views_count' => 300, 'published_at' => now()->subDays(3)]);
    $third = NewsArticle::factory()->published()->create(['views_count' => 100, 'published_at' => now()->subDay()]);
    $left_out = NewsArticle::factory()->published()->create(['views_count' => 50, 'published_at' => now()->subDay()]);
    // Muy viejo: no cuenta aunque tenga muchas vistas.
    NewsArticle::factory()->published()->create(['views_count' => 9999, 'published_at' => now()->subDays(30)]);

    $this->artisan('news:send-recommendations')
        ->expectsOutputToContain('Recomendaciones enviadas a 3 usuarios, con 3 noticia(s).')
        ->assertExitCode(0);

    foreach ($users as $user) {
        Notification::assertSentTo(
            $user,
            NewArticlePublishedNotification::class,
            fn ($notification) => $notification->article->id === $top->id && $notification->reason === 'recommended'
        );
        Notification::assertSentTo($user, NewArticlePublishedNotification::class, fn ($n) => $n->article->id === $second->id);
        Notification::assertSentTo($user, NewArticlePublishedNotification::class, fn ($n) => $n->article->id === $third->id);
    }

    Notification::assertNotSentTo($users->first(), NewArticlePublishedNotification::class, fn ($n) => $n->article->id === $left_out->id);
});

test('it does not notify an article author about their own recommended article', function () {
    Notification::fake();

    $author = User::factory()->create();
    $other = User::factory()->create();

    $article = NewsArticle::factory()->published()->create([
        'author_id' => $author->id,
        'views_count' => 100,
        'published_at' => now()->subDay(),
    ]);

    $this->artisan('news:send-recommendations')->assertExitCode(0);

    Notification::assertSentTo($other, NewArticlePublishedNotification::class, fn ($n) => $n->article->id === $article->id);
    Notification::assertNotSentTo($author, NewArticlePublishedNotification::class);
});

test('it does nothing when there are no recent published articles', function () {
    NewsArticle::factory()->published()->create(['published_at' => now()->subDays(30)]);

    $this->artisan('news:send-recommendations')
        ->expectsOutputToContain('No hay artículos recientes para recomendar.')
        ->assertExitCode(0);
});
