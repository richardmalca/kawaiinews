<?php

namespace App\Console\Commands;

use App\Models\Media;
use App\Models\NewsArticle;
use App\Support\PublicNewsCacheVersion;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Pone al día el link de portada (`featured_image`) y de audio
 * (`audio_url`) de cada artículo con la url actual de su Media —
 * quedan pisados en el artículo cuando el archivo se guardó, y no se
 * actualizan solos si después ese archivo se mueve de servidor, se
 * renombra o se optimiza (migrar/renombrar solo tocan la tabla de
 * medios, no esta copia guardada en el artículo).
 */
#[Signature('app:sync-article-featured-media-urls {--dry-run : Solo mostrar qué artículos cambiarían, sin guardar}')]
#[Description('Actualiza featured_image/audio_url de los artículos con la url actual de su Media')]
class SyncArticleFeaturedMediaUrls extends Command
{
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $synced = 0;

        foreach (NewsArticle::with('media')->has('media')->get() as $article) {
            $latestImage = $article->media->where('type', 'image')->sortByDesc('id')->first();
            $latestAudio = $article->media->where('type', 'audio')->sortByDesc('id')->first();

            $changes = [];

            if ($latestImage && $article->featured_image !== $latestImage->url) {
                $changes['featured_image'] = $latestImage->url;
            }

            if ($latestImage && $article->featured_image_card_url !== $latestImage->card_url) {
                $changes['featured_image_card_url'] = $latestImage->card_url;
            }

            if ($latestAudio && $article->audio_url !== $latestAudio->url) {
                $changes['audio_url'] = $latestAudio->url;
            }

            if ($changes === []) {
                continue;
            }

            $this->line("#{$article->id}: {$article->title}");

            if (! $dryRun) {
                $article->update($changes);
            }

            $synced++;
        }

        if ($synced === 0) {
            $this->info('Todos los artículos ya tenían la url al día.');

            return self::SUCCESS;
        }

        if (! $dryRun) {
            PublicNewsCacheVersion::bump();
        }

        $this->info($dryRun
            ? "{$synced} artículo(s) cambiarían."
            : "{$synced} artículo(s) actualizado(s).");

        return self::SUCCESS;
    }
}
