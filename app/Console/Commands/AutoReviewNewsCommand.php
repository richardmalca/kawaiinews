<?php

namespace App\Console\Commands;

use App\Services\Admin\NewsClusterService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('news:auto-review')]
#[Description('Fusiona con IA los clusters pendientes que son la misma noticia real, analiza los que faltan y rechaza automáticamente los descartables o demasiado viejos (los marcados como publicables siguen esperando aceptación)')]
class AutoReviewNewsCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(NewsClusterService $newsClusterService): int
    {
        $merged = $newsClusterService->autoMergeDuplicates();

        $this->info("Fusionados automáticamente por ser la misma noticia: {$merged}");

        $result = $newsClusterService->analyzeWithAi();

        $this->info("Clusters analizados: {$result['analyzed']}");

        if ($result['error']) {
            $this->warn($result['error']);
        }

        $rejected = $newsClusterService->autoRejectDiscarded();

        $this->info("Rechazados automáticamente por baja relevancia: {$rejected}");

        $stale = $newsClusterService->autoRejectStale();

        $this->info("Rechazados automáticamente por antigüedad: {$stale}");

        return self::SUCCESS;
    }
}
