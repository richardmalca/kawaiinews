<?php

namespace App\Console\Commands;

use App\Models\NewsArticle;
use App\Services\Admin\NewsArticleService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Repara slugs viejos que quedaron con "anos" en vez de "anios" por el bug
 * de transliteración de la "ñ" (ver NewsArticleService::slugify()). Solo
 * toca artículos cuyo título tiene "ñ" y cuyo slug realmente cambia con la
 * lógica nueva — no reescribe slugs customizados a mano sin relación.
 */
#[Signature('app:fix-legacy-year-slugs {--dry-run : Solo mostrar qué cambiaría, sin guardar}')]
#[Description('Corrige slugs de artículos viejos donde "años" quedó como "anos" en vez de "anios"')]
class FixLegacyYearSlugs extends Command
{
    public function handle(NewsArticleService $newsArticleService): int
    {
        $dryRun = $this->option('dry-run');

        $articles = NewsArticle::where('title', 'like', '%ñ%')
            ->orWhere('title', 'like', '%Ñ%')
            ->get();

        if ($articles->isEmpty()) {
            $this->info('No hay artículos con "ñ" en el título.');

            return self::SUCCESS;
        }

        $changed = 0;

        foreach ($articles as $article) {
            if ($dryRun) {
                $correctSlug = $this->previewCorrectSlug($article);

                if ($correctSlug !== $article->slug) {
                    $this->line("#{$article->id}: {$article->slug} -> {$correctSlug}");
                    $changed++;
                }

                continue;
            }

            $result = $newsArticleService->repairLegacySlug($article);

            if ($result) {
                $this->line("#{$article->id}: {$result['old']} -> {$result['new']}");
                $changed++;
            }
        }

        $this->info($changed > 0
            ? ($dryRun ? "{$changed} slug(s) cambiarían." : "{$changed} slug(s) corregido(s).")
            : 'Ningún slug necesitaba corrección.');

        return self::SUCCESS;
    }

    /**
     * Igual a NewsArticleService::repairLegacySlug() pero sin escribir
     * nada — el service no expone una versión "solo mostrar", así que la
     * reimplementamos acá nomás para el --dry-run. Devuelve el slug actual
     * sin cambios si no aplica (mismo criterio: solo toca el slug si
     * coincide exacto con lo que generaba el algoritmo viejo sin el fix).
     */
    private function previewCorrectSlug(NewsArticle $article): string
    {
        $legacySlug = Str::slug($article->title);

        if ($legacySlug !== $article->slug) {
            return $article->slug;
        }

        $base = Str::slug(str_replace(['ñ', 'Ñ'], ['ni', 'Ni'], $article->title));
        $slug = $base;
        $suffix = 1;

        while (
            NewsArticle::where('slug', $slug)
                ->where('id', '!=', $article->id)
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
