<?php

namespace Database\Seeders;

use App\Models\AiProvider;
use Illuminate\Database\Seeder;

class AiProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AiProvider::firstOrCreate(
            ['provider' => 'anthropic'],
            [
                'label' => 'Anthropic Claude',
                'default_model' => 'claude-sonnet-5',
                'is_active' => true,
            ],
        );
    }
}
