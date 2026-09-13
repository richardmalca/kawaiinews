<?php

use App\Models\NewsArticle;
use App\Models\User;
use App\Notifications\UserMentionedNotification;
use Illuminate\Support\Facades\Notification;

test('mentioning a followed user in a comment sends a notification to that user', function () {
    Notification::fake();

    $author = User::factory()->create(['username' => 'otakureader']);
    $mentioned = User::factory()->create(['username' => 'senpaikun']);
    $author->follow($mentioned);

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

test('mentioning a user you do not follow does not send a notification', function () {
    Notification::fake();

    $author = User::factory()->create(['username' => 'otakureader']);
    $notFollowed = User::factory()->create(['username' => 'unknownuser']);
    $article = NewsArticle::factory()->published()->create();

    $this->actingAs($author)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Hola @unknownuser mira esto!',
        ])
        ->assertCreated();

    Notification::assertNothingSent();
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

test('a logged in user can query followed users suggestions for mention autocomplete', function () {
    $author = User::factory()->create(['username' => 'otakureader']);
    $followed = User::factory()->create(['username' => 'senpaikun', 'name' => 'Senpai Kun']);
    $other = User::factory()->create(['username' => 'otheruser']);

    $author->follow($followed);

    $this->actingAs($author)
        ->getJson(route('public.followed_users.suggestions', ['q' => 'sen']))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.username', 'senpaikun');

    $this->actingAs($author)
        ->getJson(route('public.followed_users.suggestions', ['q' => 'oth']))
        ->assertOk()
        ->assertJsonCount(0);
});
