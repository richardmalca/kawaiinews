<?php

use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use App\Notifications\CommentRepliedNotification;
use Illuminate\Support\Facades\Notification;

test('a notification is sent to parent comment author when receiving a reply', function () {
    Notification::fake();

    $author = User::factory()->create();
    $replier = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $rootComment = Comment::factory()->create([
        'news_article_id' => $article->id,
        'user_id' => $author->id,
    ]);

    $this->actingAs($replier)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Te respondo a tu comentario',
            'reply_to_comment_id' => $rootComment->id,
        ])
        ->assertCreated();

    Notification::assertSentTo(
        $author,
        CommentRepliedNotification::class,
        fn ($notification) => $notification->replier->id === $replier->id
    );
});

test('a user does not receive a notification when replying to their own comment', function () {
    Notification::fake();

    $user = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();

    $rootComment = Comment::factory()->create([
        'news_article_id' => $article->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->postJson(route('public.comments.store', $article->slug), [
            'body' => 'Me autorepondo',
            'reply_to_comment_id' => $rootComment->id,
        ])
        ->assertCreated();

    Notification::assertNothingSent();
});

test('a user can list notifications and mark them as read', function () {
    $user = User::factory()->create();
    $replier = User::factory()->create();
    $article = NewsArticle::factory()->published()->create();
    $comment = Comment::factory()->create(['news_article_id' => $article->id, 'user_id' => $replier->id]);

    $user->notify(new CommentRepliedNotification($comment, $replier));

    expect($user->unreadNotifications()->count())->toBe(1);

    // List notifications
    $res = $this->actingAs($user)
        ->getJson(route('public.notifications.index'));

    $res->assertOk()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonCount(1, 'notifications');

    $notificationId = $user->unreadNotifications()->first()->id;

    // Mark single as read
    $this->actingAs($user)
        ->postJson(route('public.notifications.read', $notificationId))
        ->assertOk()
        ->assertJson(['unread_count' => 0]);

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);

    // Create another and mark all
    $user->notify(new CommentRepliedNotification($comment, $replier));
    expect($user->fresh()->unreadNotifications()->count())->toBe(1);

    $this->actingAs($user)
        ->postJson(route('public.notifications.read_all'))
        ->assertOk()
        ->assertJson(['unread_count' => 0]);

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});
