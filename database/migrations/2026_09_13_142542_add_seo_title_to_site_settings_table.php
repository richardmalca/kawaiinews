<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            // `name` es la marca corta (sidebar del panel, og:site_name,
            // sufijo " - {name}" en el título de cada noticia). `seo_title`
            // es el título completo que Google/redes muestran cuando la
            // página no tiene uno propio (la home, por ejemplo) — a veces
            // se necesita uno, a veces el otro, no son lo mismo.
            $table->string('seo_title')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('seo_title');
        });
    }
};
