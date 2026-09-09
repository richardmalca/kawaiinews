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

Schedule::command('views:flush')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
