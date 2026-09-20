<?php

namespace Database\Factories;

use App\Models\RadioQueueItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RadioQueueItem>
 */
class RadioQueueItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'position' => fake()->numberBetween(1, 100),
            'type' => 'music',
            'title' => fake()->words(3, true),
            'audio_url' => 'https://example.test/radio/'.fake()->uuid().'.mp3',
            'duration_seconds' => fake()->numberBetween(120, 240),
        ];
    }
}
