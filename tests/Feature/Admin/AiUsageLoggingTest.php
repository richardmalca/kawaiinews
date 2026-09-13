<?php

use App\Models\AiProvider;
use App\Models\AiUsageLog;
use App\Models\Comment;
use App\Models\NewsCluster;
use App\Services\Admin\NewsClusterService;
use App\Services\Public\CommentModerationService;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;

test('analyzing clusters with ai records token usage', function () {
    AiProvider::factory()->create(['is_active' => true, 'api_key' => 'test-key']);
    NewsCluster::factory()->create(['status' => 'pending', 'ai_verdict' => null]);

    Prism::fake([
        TextResponseFake::make()->withText('ID:1:PUBLICAR:buena cobertura:NO:NA'),
    ]);

    app(NewsClusterService::class)->analyzeWithAi();

    expect(AiUsageLog::where('kind', 'analyze')->exists())->toBeTrue();
});

test('ai comment moderation records token usage', function () {
    AiProvider::factory()->create(['is_active_for_moderation' => true, 'api_key' => 'test-key']);
    $comment = Comment::factory()->create(['status' => 'pending']);

    Prism::fake([TextResponseFake::make()->withText('OK')]);

    app(CommentModerationService::class)->reviewWithAi($comment);

    expect(AiUsageLog::where('kind', 'moderation')->where('subject_id', $comment->id)->exists())->toBeTrue();
});
