<?php

namespace App\Console\Commands;

use App\Models\NewsArticle;
use App\Models\User;
use App\Notifications\NewArticlePublishedNotification;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

#[Signature('news:send-recommendations')]
#[Description('Manda a todos los usuarios (sigan algo o no) unas pocas noticias populares de la semana, para que la app no se sienta muerta si nunca siguieron nada')]
class SendRecommendedArticlesCommand extends Command
{
    /**
     * No todas las noticias de la semana, solo las mejores — si manda
     * demasiadas se siente spam, no una recomendación.
     */
    private const MAX_ARTICLES = 3;

    public function handle(): int
    {
        $articles = NewsArticle::where('status', 'published')
            ->where('published_at', '>=', now()->subDays(7))
            ->orderByDesc('views_count')
            ->limit(self::MAX_ARTICLES)
            ->get();

        if ($articles->isEmpty()) {
            $this->info('No hay artículos recientes para recomendar.');

            return self::SUCCESS;
        }

        $usersNotified = 0;

        // A todos, sigan algo o no — a los que ya siguen la categoría les
        // llega igual que cualquier noticia nueva, y a los que no siguen
        // nada es la única forma de que la app les avise de algo.
        User::query()->chunkById(100, function ($users) use ($articles, &$usersNotified) {
            foreach ($articles as $article) {
                $recipients = $users->reject(fn (User $user) => $user->id === $article->author_id);

                if ($recipients->isEmpty()) {
                    continue;
                }

                Notification::send($recipients, new NewArticlePublishedNotification(
                    article: $article,
                    reason: 'recommended',
                ));
            }

            $usersNotified += $users->count();
        });

        $this->info("Recomendaciones enviadas a {$usersNotified} usuarios, con {$articles->count()} noticia(s).");

        return self::SUCCESS;
    }
}
