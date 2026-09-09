<?php

namespace App\Console\Commands;

use App\Services\Admin\NewsScraperService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('news:scrape')]
#[Description('Busca noticias nuevas en las fuentes activas y las agrupa en clusters')]
class ScrapeNewsCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(NewsScraperService $newsScraperService): int
    {
        $result = $newsScraperService->run();

        $this->info("Fuentes recorridas: {$result['sources_scraped']}");
        $this->info("Noticias encontradas: {$result['items_found']}");
        $this->info("Noticias nuevas: {$result['items_new']}");

        foreach ($result['errors'] as $error) {
            $this->warn($error);
        }

        return self::SUCCESS;
    }
}
