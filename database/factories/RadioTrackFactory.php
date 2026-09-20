<?php

namespace Database\Factories;

use App\Models\RadioTrack;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RadioTrack>
 */
class RadioTrackFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->words(3, true),
            'artist' => fake()->name(),
            'url' => 'https://example.test/radio/'.fake()->uuid().'.mp3',
            'duration_seconds' => fake()->numberBetween(120, 240),
            'active' => true,
        ];
    }
}
