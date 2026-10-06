<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('news_articles', function (Blueprint $table) {
            // 'ai' | 'url' (foto oficial descargada de la fuente) | 'upload'
            // (subida a mano) | null (artículos viejos de antes de esto, o
            // sin portada). El frontend lo usa para decidir si mostrar el
            // badge "Ilustración generada con IA" -- antes lo inferían de
            // si la URL vivía en nuestro CDN, pero ahora las fotos
            // oficiales descargadas también viven ahí, así que esa
            // heurística etiquetaba mal fotos reales como IA.
            $table->string('featured_image_source')->nullable()->after('featured_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news_articles', function (Blueprint $table) {
            $table->dropColumn('featured_image_source');
        });
    }
};
