<?php

namespace Database\Factories;

use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    protected $model = Media::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'url' => $this->faker->imageUrl(),
            'original_name' => $this->faker->words(3, true),
            'source' => 'upload',
            'type' => 'image',
            'news_article_id' => null,
        ];
    }

    public function audio(): static
    {
        return $this->state(fn () => [
            'url' => 'https://example.test/audio/'.$this->faker->uuid().'.mp3',
            'source' => 'ai',
            'type' => 'audio',
        ]);
    }
}
