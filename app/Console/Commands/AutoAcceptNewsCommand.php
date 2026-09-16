<?php

namespace App\Console\Commands;

use App\Services\Admin\NewsClusterService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('news:auto-accept')]
#[Description('Acepta y convierte en borrador las mejores noticias pendientes marcadas como publicables por la IA, hasta el tope diario configurado en Configuración del sitio (no hace nada si está apagado)')]
class AutoAcceptNewsCommand extends Command
{
    public function handle(NewsClusterService $newsClusterService): int
    {
        $result = $newsClusterService->autoAcceptDaily();

        $this->info("Noticias aceptadas automáticamente: {$result['applied']}");

        return self::SUCCESS;
    }
}
