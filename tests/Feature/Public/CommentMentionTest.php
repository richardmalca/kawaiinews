<?php

use App\Models\NewsArticle;
use App\Models\User;
use App\Notifications\UserMentionedNotification;
use Illuminate\Support\Facades\Notification;

test('mentioning a user in a comment sends a notification to that user', function () {
    Notification::fake();

    $author = User::factory()->create(['username' => 'otakureader']);
    $mentioned = User::factory()->create(['username' => 'senpaikun']);
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($author)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Hola @senpaikun mira esto que genial!',
        ])
        ->assertCreated();

    Notification::assertSentTo(
        $mentioned,
        UserMentionedNotification::class,
        function ($notification) use ($author, $article) {
            return $notification->mentioner->id === $author->id
                && $notification->comment->newsArticle->id === $article->id;
        }
    );
});

test('mentioning oneself does not send a notification', function () {
    Notification::fake();

    $author = User::factory()->create(['username' => 'otakureader']);
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($author)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Hola @otakureader me hablo a mi mismo',
        ])
        ->assertCreated();

    Notification::assertNothingSent();
});
