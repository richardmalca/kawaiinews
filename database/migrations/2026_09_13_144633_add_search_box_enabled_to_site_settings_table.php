<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            // Habilita el schema WebSite + SearchAction ("sitelinks search
            // box" de Google: la cajita de búsqueda que a veces aparece
            // debajo del sitio en los resultados). Apunta al home con
            // ?q=... que ya soporta buscar artículos.
            $table->boolean('search_box_enabled')->default(false)->after('tiktok_url');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('search_box_enabled');
        });
    }
};
