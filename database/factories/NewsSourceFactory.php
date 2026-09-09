<?php

namespace Database\Factories;

use App\Models\NewsSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NewsSource>
 */
class NewsSourceFactory extends Factory
{
    protected $model = NewsSource::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'source_key' => $this->faker->unique()->slug(2),
            'category' => $this->faker->randomElement(['anime', 'gaming', 'geek']),
            'label' => $this->faker->company(),
            'url' => $this->faker->url(),
            'rss_url' => $this->faker->url(),
            'is_active' => true,
            'last_scraped_at' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function withoutRss(): static
    {
        return $this->state(fn () => ['rss_url' => null]);
    }
}
