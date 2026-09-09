<?php

namespace Database\Factories;

use App\Models\NewsArticle;
use App\Models\Share;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Share>
 */
class ShareFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'news_article_id' => NewsArticle::factory(),
            'channel' => fake()->randomElement(['whatsapp', 'twitter', 'facebook', 'link']),
        ];
    }
}
