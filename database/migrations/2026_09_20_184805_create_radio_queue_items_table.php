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
        Schema::create('radio_queue_items', function (Blueprint $table) {
            $table->id();
            // Orden de reproducción dentro de la cola actual — se
            // reconstruye entera en cada corrida de radio:build-queue
            // (se borra todo y se vuelve a insertar), así que nunca hace
            // falta reordenar filas existentes, solo recrearlas.
            $table->unsignedInteger('position');
            $table->string('type'); // 'music' | 'article'
            $table->foreignId('radio_track_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('news_article_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('audio_url');
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('radio_queue_items');
    }
};
