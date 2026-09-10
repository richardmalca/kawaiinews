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
        Schema::table('news_clusters', function (Blueprint $table) {
            $table->boolean('ai_is_rumor')->nullable()->after('ai_reason');
            // alta/media/baja — solo tiene sentido cuando ai_is_rumor=true.
            // No es una verificación real contra internet (la IA no tiene
            // acceso en vivo), es una estimación por cantidad/consistencia
            // de las fuentes que lo cubren.
            $table->string('ai_credibility')->nullable()->after('ai_is_rumor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news_clusters', function (Blueprint $table) {
            $table->dropColumn(['ai_is_rumor', 'ai_credibility']);
        });
    }
};
