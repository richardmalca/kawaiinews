<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\NewsArticle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'news_article_id' => NewsArticle::factory(),
            'user_id' => User::factory(),
            'parent_id' => null,
            'reply_to_comment_id' => null,
            'body' => fake()->realText(120),
            'is_spoiler' => false,
        ];
    }

    public function spoiler(): static
    {
        return $this->state(fn () => ['is_spoiler' => true]);
    }

    /**
     * Respuesta directa a un comentario raíz.
     */
    public function replyTo(Comment $comment): static
    {
        return $this->state(fn () => [
            'news_article_id' => $comment->news_article_id,
            'parent_id' => $comment->isRoot() ? $comment->id : $comment->parent_id,
            'reply_to_comment_id' => $comment->isRoot() ? null : $comment->id,
        ]);
    }
}
