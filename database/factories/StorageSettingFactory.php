<?php

namespace Database\Factories;

use App\Models\StorageSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorageSetting>
 */
class StorageSettingFactory extends Factory
{
    protected $model = StorageSetting::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'access_key' => $this->faker->uuid(),
            'secret_key' => $this->faker->sha256(),
            'bucket' => 'kawaiinews',
            'region' => 'us-east-1',
            'endpoint' => 'https://s3.wasabisys.com',
            'use_path_style_endpoint' => true,
        ];
    }
}
