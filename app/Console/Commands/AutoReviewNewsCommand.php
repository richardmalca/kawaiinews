<?php

namespace App\Console\Commands;

use App\Services\Admin\NewsClusterService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('news:auto-review')]
#[Description('Analiza con IA los clusters pendientes sin veredicto y rechaza automáticamente los marcados como descartables (los marcados como publicables siguen esperando aceptación manual)')]
class AutoReviewNewsCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(NewsClusterService $newsClusterService): int
    {
        $result = $newsClusterService->analyzeWithAi();

        $this->info("Clusters analizados: {$result['analyzed']}");

        if ($result['error']) {
            $this->warn($result['error']);
        }

        $rejected = $newsClusterService->autoRejectDiscarded();

        $this->info("Rechazados automáticamente por baja relevancia: {$rejected}");

        return self::SUCCESS;
    }
}
