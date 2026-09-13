<?php

namespace App\Jobs;

use App\Models\NewsArticle;
use App\Models\Tag;
use App\Models\User;
use App\Notifications\NewArticlePublishedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class SendNewArticleNotificationsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $articleId
    ) {}

    public function handle(): void
    {
        $article = NewsArticle::with(['author', 'tags'])->find($this->articleId);

        if (! $article || $article->status !== 'published') {
            return;
        }

        $authorId = $article->author_id;

        /** @var array<int, array{reason: string, reason_label: ?string}> $recipients */
        $recipients = [];

        // 1. Seguidores del autor (prioridad más alta como razón)
        if ($authorId && $article->author) {
            $authorFollowerIds = $article->author->followers()
                ->where('users.id', '!=', $authorId)
                ->pluck('users.id')
                ->all();

            foreach ($authorFollowerIds as $userId) {
                $recipients[$userId] = [
                    'reason' => 'author',
                    'reason_label' => $article->author->name,
                ];
            }
        }

        // 2. Seguidores de la categoría
        $categoryFollowerIds = DB::table('category_user')
            ->where('category', $article->category)
            ->when($authorId, fn ($q) => $q->where('user_id', '!=', $authorId))
            ->pluck('user_id')
            ->all();

        foreach ($categoryFollowerIds as $userId) {
            if (! isset($recipients[$userId])) {
                $recipients[$userId] = [
                    'reason' => 'category',
                    'reason_label' => $article->category,
                ];
            }
        }

        // 3. Seguidores de los tags
        $tagIds = $article->tags->pluck('id')->all();
        if (! empty($tagIds)) {
            $tagFollowerIds = DB::table('followables')
                ->where('followable_type', Tag::class)
                ->whereIn('followable_id', $tagIds)
                ->when($authorId, fn ($q) => $q->where('user_id', '!=', $authorId))
                ->distinct()
                ->pluck('user_id')
                ->all();

            foreach ($tagFollowerIds as $userId) {
                if (! isset($recipients[$userId])) {
                    $firstTag = $article->tags->first();
                    $recipients[$userId] = [
                        'reason' => 'tag',
                        'reason_label' => $firstTag?->name,
                    ];
                }
            }
        }

        if (empty($recipients)) {
            return;
        }

        // Agrupar usuarios por razón para enviar notificaciones en lote de forma óptima
        $groupedByReason = [];
        foreach ($recipients as $userId => $meta) {
            $key = $meta['reason'].':'.($meta['reason_label'] ?? '');
            $groupedByReason[$key]['reason'] = $meta['reason'];
            $groupedByReason[$key]['reason_label'] = $meta['reason_label'];
            $groupedByReason[$key]['user_ids'][] = $userId;
        }

        foreach ($groupedByReason as $group) {
            User::whereIn('id', $group['user_ids'])
                ->chunk(100, function ($users) use ($article, $group) {
                    Notification::send(
                        $users,
                        new NewArticlePublishedNotification(
                            article: $article,
                            reason: $group['reason'],
                            reasonLabel: $group['reason_label']
                        )
                    );
                });
        }
    }
}
