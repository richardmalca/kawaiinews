<?php

namespace App\Console\Commands;

use App\Services\Admin\MediaLibraryService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

/**
 * Vuelve a comprimir todas las imágenes ya subidas con el nivel de
 * calidad actual de ImageOptimizerService — para cuando ese valor cambia
 * (ej. de 82 a 75, el que recomienda Google) y hace falta que lo viejo
 * también se achique, no solo lo nuevo que se suba de ahora en más.
 */
#[Signature('media:reoptimize-images')]
#[Description('Vuelve a comprimir todas las imágenes ya subidas con el nivel de calidad actual')]
class ReoptimizeImagesCommand extends Command
{
    public function handle(MediaLibraryService $mediaLibraryService): int
    {
        $result = $mediaLibraryService->reoptimizeAllImages();

        if ($result['reoptimized'] > 0) {
            Artisan::call('app:sync-article-featured-media-urls');
        }

        $savedKb = round(($result['bytes_before'] - $result['bytes_after']) / 1024, 1);

        $this->info("Reoptimizadas {$result['reoptimized']} imagen(es), {$result['failed']} fallida(s), {$result['skipped']} omitida(s) (GIF u otro formato). Ahorro: {$savedKb} KB.");

        return self::SUCCESS;
    }
}
