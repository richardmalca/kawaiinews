<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

/**
 * Media.url se guarda completo en base de datos, no solo el path relativo
 * — así que cambiar el dominio público en Configuración de almacenamiento
 * (ej. de pub-xxx.r2.dev a un dominio propio) solo afecta a los archivos
 * nuevos. Este comando reescribe en bloque las URLs ya guardadas que
 * empiezan con el dominio viejo, sin mover ni tocar los archivos físicos
 * (siguen siendo el mismo bucket/objeto, solo cambia cómo se linkean) — y
 * después corre app:sync-article-featured-media-urls, que ya existía para
 * propagar la url de Media a featured_image/audio_url de los artículos.
 *
 * Genérico a propósito (recibe los dominios como argumentos) para que
 * sirva otra vez si el dominio público vuelve a cambiar en el futuro.
 */
#[Signature('media:rewrite-domain {old : Dominio viejo, ej. https://pub-xxx.r2.dev} {new : Dominio nuevo, ej. https://img.kawaiinews.net} {--dry-run : Solo mostrar cuántos registros cambiarían, sin guardar}')]
#[Description('Reescribe en la base de datos las URLs de Media que apuntan a un dominio viejo, para que usen el dominio público actual')]
class RewriteMediaDomainCommand extends Command
{
    public function handle(): int
    {
        $old = rtrim((string) $this->argument('old'), '/');
        $new = rtrim((string) $this->argument('new'), '/');
        $dryRun = (bool) $this->option('dry-run');

        if ($old === $new) {
            $this->error('El dominio viejo y el nuevo son iguales, no hay nada que reescribir.');

            return self::FAILURE;
        }

        $rows = Media::where('url', 'like', "{$old}%")->get(['id', 'url']);

        if ($rows->isEmpty()) {
            $this->info("Ningún registro de Media apunta a {$old}.");

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->info("[dry-run] Se reescribirían {$rows->count()} registro(s) de Media hacia {$new}.");

            return self::SUCCESS;
        }

        foreach ($rows as $media) {
            $media->update(['url' => $new.Str::after($media->url, $old)]);
        }

        $this->info("Reescritos {$rows->count()} registro(s) de Media hacia {$new}.");

        Artisan::call('app:sync-article-featured-media-urls');
        $this->line(trim(Artisan::output()));

        return self::SUCCESS;
    }
}
