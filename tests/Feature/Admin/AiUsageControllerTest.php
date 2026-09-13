<?php

use App\Models\AiUsageLog;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('superadmin');
    $this->actingAs($user);
});

test('the ai usage page aggregates tokens and estimated cost for the current month', function () {
    AiUsageLog::factory()->create([
        'kind' => 'draft',
        'provider' => 'anthropic',
        'model' => 'claude-sonnet-5',
        'prompt_tokens' => 1_000_000,
        'completion_tokens' => 1_000_000,
    ]);
    // Fuera de este mes: no debe contar.
    AiUsageLog::factory()->create(['created_at' => now()->subMonths(2)]);

    $response = $this->get(route('admin.ai-usage.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('totalCallsThisMonth', 1)
        ->where('byKind.draft.prompt_tokens', 1_000_000)
        ->where('estimatedCostUsd', 18)
        ->where('hasUnknownPricing', false)
    );
});

test('a model without configured pricing is flagged instead of guessed', function () {
    AiUsageLog::factory()->create([
        'provider' => 'groq',
        'model' => 'llama-3.3-70b-versatile',
        'prompt_tokens' => 1000,
        'completion_tokens' => 1000,
    ]);

    $response = $this->get(route('admin.ai-usage.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('hasUnknownPricing', true)
        ->where('estimatedCostUsd', 0)
    );
});
