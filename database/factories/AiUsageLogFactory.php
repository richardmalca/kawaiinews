<?php

namespace Database\Factories;

use App\Models\AiUsageLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiUsageLog>
 */
class AiUsageLogFactory extends Factory
{
    protected $model = AiUsageLog::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'kind' => 'draft',
            'provider' => 'anthropic',
            'model' => 'claude-sonnet-5',
            'prompt_tokens' => $this->faker->numberBetween(500, 3000),
            'completion_tokens' => $this->faker->numberBetween(200, 1500),
            'created_at' => now(),
        ];
    }
}
