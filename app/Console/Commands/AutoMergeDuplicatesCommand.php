<?php

namespace App\Console\Commands;

use App\Services\Admin\NewsClusterService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('news:auto-merge')]
#[Description('Fusiona con IA los clusters pendientes recientes que son la misma noticia real cubierta por distintas fuentes')]
class AutoMergeDuplicatesCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(NewsClusterService $newsClusterService): int
    {
        $merged = $newsClusterService->autoMergeDuplicates();

        $this->info("Fusionados automáticamente por ser la misma noticia: {$merged}");

        return self::SUCCESS;
    }
}
