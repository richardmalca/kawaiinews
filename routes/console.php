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

// Una vez al día alcanza de sobra para agarrar duplicados (el scraper no
// suele tardar más de un día en traer la misma noticia desde otra
// fuente) — corría junto con news:auto-review cada 3h y eso duplicaba el
// gasto en IA de analizar la bandeja sin necesidad real.
Schedule::command('news:auto-merge')
    ->dailyAt('05:00')
    ->withoutOverlapping()
    ->onOneServer();

// 10 minutos después del scrape (":10", ":03:10", etc.) para darle tiempo a
// que termine de agrupar los clusters nuevos antes de analizarlos.
Schedule::command('news:auto-review')
    ->everyThreeHours(10)
    ->withoutOverlapping()
    ->onOneServer();

// Cada hora (no controla que se ejecute, decide adentro solo si el admin
// lo activó en Configuración del sitio): suelta como mucho 1 noticia
// publicable por corrida hasta agotar el tope diario configurado — así no
// se publican todas juntas de golpe, quedan repartidas a lo largo del
// día. La frecuencia (cada hora en vez de cada 3h) es a propósito más
// seguido de lo estrictamente necesario para el tope diario típico (ej.
// 5/día alcanzaría con cada 3h), para poder sostener temporadas de tope
// más alto (ej. 10-15/día mientras se genera contenido) sin tocar el
// código de nuevo — igual nunca se pasa del tope, solo permite llegar a
// él en un solo día si el admin lo pide.
Schedule::command('news:auto-accept')
    ->hourlyAt(20)
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('views:flush')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();

// 1 vez por semana: manda a todos los usuarios (sigan algo o no) las
// pocas noticias más populares de los últimos 7 días — así la app le
// avisa algo hasta al que nunca siguió nada, sin mandar todos los días
// (sería spam, no recomendación).
Schedule::command('news:send-recommendations')
    ->weeklyOn(1, '09:00')
    ->withoutOverlapping()
    ->onOneServer();
