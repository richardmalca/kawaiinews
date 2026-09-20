<?php

namespace App\Console\Commands;

use App\Services\Admin\RadioService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('radio:build-queue')]
#[Description('Reconstruye la cola de KawaiiRadio: música + últimas noticias narradas, presentadas por el DJ de IA')]
class BuildRadioQueueCommand extends Command
{
    public function handle(RadioService $radioService): int
    {
        $result = $radioService->buildQueue();

        if ($result['skipped_no_music']) {
            $this->error('No hay ninguna pista de música activa cargada — subí al menos una desde el panel de KawaiiRadio.');

            return self::FAILURE;
        }

        $this->info("Cola reconstruida: {$result['queued']} item(s).");

        if ($result['skipped_no_audio'] > 0) {
            $this->line("{$result['skipped_no_audio']} noticia(s) reciente(s) se dejaron afuera por no tener narración todavía.");
        }

        return self::SUCCESS;
    }
}
