<?php

namespace App\Console\Commands;

use App\Models\NewsArticle;
use App\Support\PublicNewsCacheVersion;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Convierte el <u> (subrayado) que quedó en artículos ya publicados a
 * <strong> (negrita) — el prompt de redacción con IA y el editor manual
 * ya no usan subrayado como énfasis porque en la web se confunde con un
 * link (ver NewsArticleService y RichTextEditor).
 */
#[Signature('app:fix-underline-emphasis {--dry-run : Solo mostrar qué artículos cambiarían, sin guardar}')]
#[Description('Reemplaza <u> por <strong> en el cuerpo de artículos ya publicados')]
class FixUnderlineEmphasis extends Command
{
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $articles = NewsArticle::where('body', 'like', '%<u>%')->get();

        if ($articles->isEmpty()) {
            $this->info('No hay artículos con <u> en el cuerpo.');

            return self::SUCCESS;
        }

        foreach ($articles as $article) {
            $occurrences = substr_count($article->body, '<u>');

            $this->line("#{$article->id}: {$article->title} ({$occurrences} ocurrencia(s))");

            if (! $dryRun) {
                $article->update([
                    'body' => str_replace(['<u>', '</u>'], ['<strong>', '</strong>'], $article->body),
                ]);
            }
        }

        if (! $dryRun) {
            PublicNewsCacheVersion::bump();
        }

        $this->info($dryRun
            ? "{$articles->count()} artículo(s) cambiarían."
            : "{$articles->count()} artículo(s) corregido(s).");

        return self::SUCCESS;
    }
}
