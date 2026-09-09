<?php

namespace Database\Factories;

use App\Models\NewsCluster;
use App\Models\NewsSource;
use App\Models\ScrapedItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScrapedItem>
 */
class ScrapedItemFactory extends Factory
{
    protected $model = ScrapedItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'news_cluster_id' => NewsCluster::factory(),
            'news_source_id' => NewsSource::factory(),
            'title' => $this->faker->sentence(6),
            'url' => $this->faker->unique()->url(),
            'summary' => $this->faker->paragraph(),
            'image_url' => null,
            'published_at' => now(),
        ];
    }
}
