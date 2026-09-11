<?php

namespace App\Jobs;

use App\Models\Comment;
use App\Services\Public\CommentModerationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Capa 2 de la moderación de comentarios (ver
 * CommentModerationService::reviewWithAi()). Se dispara solo cuando la
 * Capa 1 (filtro por reglas) ya marcó un comentario como `pending` — nunca
 * para comentarios normales, así no hay costo de IA por cada comentario
 * del sitio.
 */
class ModerateCommentWithAiJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;

    public int $tries = 1;

    public function __construct(public readonly Comment $comment) {}

    public function handle(CommentModerationService $commentModerationService): void
    {
        $commentModerationService->reviewWithAi($this->comment);
    }
}
