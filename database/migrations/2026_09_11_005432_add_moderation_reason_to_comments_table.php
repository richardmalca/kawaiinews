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
        Schema::table('comments', function (Blueprint $table) {
            // Por qué la IA (Capa 2) decidió retenerlo, ej. "Vulnera las
            // normas de la comunidad". Null si nunca pasó por la IA (lo
            // agarró solo el filtro por reglas de la Capa 1) o si la IA lo
            // aprobó.
            $table->string('moderation_reason')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('moderation_reason');
        });
    }
};
