<?php

namespace Database\Factories;

use App\Models\NewsCluster;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NewsCluster>
 */
class NewsClusterFactory extends Factory
{
    protected $model = NewsCluster::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(6),
            'category' => $this->faker->randomElement(['anime', 'gaming', 'geek']),
            'summary' => $this->faker->paragraph(),
            'image_url' => null,
            'sources_count' => 1,
            'relevance_score' => $this->faker->randomFloat(4, 1, 30),
            'status' => 'pending',
            'ai_verdict' => null,
            'ai_reason' => null,
            'first_seen_at' => now(),
            'last_seen_at' => now(),
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn () => ['status' => 'accepted']);
    }
}
