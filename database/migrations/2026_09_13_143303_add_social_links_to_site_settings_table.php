<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->string('facebook_url')->nullable()->after('twitter_handle');
            $table->string('instagram_url')->nullable()->after('facebook_url');
            $table->string('tiktok_url')->nullable()->after('instagram_url');
        });

        // Título y descripción por defecto "listos para usar" — solo si la
        // fila ya existe y todavía no se cargó nada (no pisa lo que un
        // admin ya haya escrito a mano).
        DB::table('site_settings')
            ->where('id', 1)
            ->whereNull('seo_title')
            ->update(['seo_title' => 'Kawaii News - Noticias de Anime, Manga y Videojuegos']);

        DB::table('site_settings')
            ->where('id', 1)
            ->whereNull('description')
            ->update(['description' => 'Las últimas noticias de anime, manga, videojuegos y cultura otaku: estrenos, tráilers, anuncios y reseñas, actualizado todos los días.']);
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['facebook_url', 'instagram_url', 'tiktok_url']);
        });
    }
};
