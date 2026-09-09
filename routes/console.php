<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('news:scrape')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->onOneServer();

// 5 minutos después del scrape (":05"/":35") para darle tiempo a que termine
// de agrupar los clusters nuevos antes de analizarlos.
Schedule::command('news:auto-review')
    ->cron('5,35 * * * *')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('views:flush')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
