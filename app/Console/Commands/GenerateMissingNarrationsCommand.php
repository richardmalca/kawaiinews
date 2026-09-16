<?php

namespace App\Console\Commands;

use App\Models\NewsArticle;
use App\Services\Admin\MediaLibraryService;
use App\Support\PublicNewsCacheVersion;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

/**
 * Genera la narración de audio para todos los artículos que todavía no
 * tienen una — un backfill de una sola vez para las noticias que se
 * crearon antes de tener armada la narración automática (ver
 * GenerateArticleNarrationJob, que hace esto mismo pero solo para las
 * nuevas).
 */
#[Signature('app:generate-missing-narrations {--dry-run : Solo mostrar qué artículos cambiarían, sin generar nada}')]
#[Description('Genera con el proveedor de audio activo la narración de los artículos sin audio_url')]
class GenerateMissingNarrationsCommand extends Command
{
    public function handle(MediaLibraryService $mediaLibraryService): int
    {
        $dryRun = $this->option('dry-run');

        $articles = NewsArticle::where(fn ($query) => $query->whereNull('audio_url')->orWhere('audio_url', ''))
            ->orderBy('id')
            ->get();

        if ($articles->isEmpty()) {
            $this->info('Todos los artículos ya tienen audio.');

            return self::SUCCESS;
        }

        $generated = 0;
        $failed = 0;

        foreach ($articles as $article) {
            $this->line("#{$article->id}: {$article->title}");

            if ($dryRun) {
                continue;
            }

            try {
                $media = $mediaLibraryService->generateNarration($article);
                $article->update(['audio_url' => $media->url]);
                $generated++;
            } catch (Throwable $exception) {
                $failed++;
                $this->warn("  falló: {$exception->getMessage()}");
            }
        }

        if ($dryRun) {
            $this->info("{$articles->count()} artículo(s) generarían audio.");

            return self::SUCCESS;
        }

        if ($generated > 0) {
            PublicNewsCacheVersion::bump();
        }

        $this->info("Generados: {$generated}. Fallidos: {$failed}.");

        return self::SUCCESS;
    }
}
