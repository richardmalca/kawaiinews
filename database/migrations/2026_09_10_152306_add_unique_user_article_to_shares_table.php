<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Antes de restringir, unificamos duplicados ya existentes: nos
        // quedamos con el share más reciente de cada (user_id, news_article_id)
        // y borramos el resto, para que puedan seguir apareciendo múltiples
        // veces en el perfil de un usuario.
        $keepIds = DB::table('shares')
            ->whereNotNull('user_id')
            ->select(DB::raw('MAX(id) as id'))
            ->groupBy('user_id', 'news_article_id')
            ->pluck('id');

        DB::table('shares')
            ->whereNotNull('user_id')
            ->whereNotIn('id', $keepIds)
            ->delete();

        Schema::table('shares', function (Blueprint $table) {
            $table->unique(['user_id', 'news_article_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shares', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'news_article_id']);
        });
    }
};
