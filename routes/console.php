<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('news:scrape')
    ->everyThreeHours()
    ->withoutOverlapping()
    ->onOneServer();

// 10 minutos después del scrape (":10", ":03:10", etc.) para darle tiempo a
// que termine de agrupar los clusters nuevos antes de analizarlos.
Schedule::command('news:auto-review')
    ->everyThreeHours(10)
    ->withoutOverlapping()
    ->onOneServer();

// Varias veces al día, 20 minutos después de auto-review (no controla que
// se ejecute, decide adentro solo si el admin lo activó en Configuración
// del sitio): suelta como mucho 1 noticia publicable por corrida hasta
// agotar el tope diario configurado — así no se publican todas juntas de
// golpe a la misma hora, quedan repartidas a lo largo del día.
Schedule::command('news:auto-accept')
    ->cron('20 */3 * * *')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('views:flush')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
