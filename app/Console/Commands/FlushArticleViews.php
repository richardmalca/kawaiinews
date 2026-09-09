<?php

namespace App\Console\Commands;

use App\Services\Public\ArticleViewService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('views:flush')]
#[Description('Vuelca a la base los contadores de vistas de artículos acumulados en caché')]
class FlushArticleViews extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ArticleViewService $articleViewService): int
    {
        $flushed = $articleViewService->flushPending();

        if ($flushed > 0) {
            $this->info("Vistas volcadas para {$flushed} artículo(s).");
        }

        return self::SUCCESS;
    }
}
