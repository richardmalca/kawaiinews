<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Palabras/frases que la Capa 2 (IA) identificó como ofensivas al
     * bloquear un comentario — se suman acá para que la próxima vez las
     * agarre la Capa 1 (gratis, instantánea) sin tener que volver a
     * consultar a la IA por lo mismo. Ver
     * CommentModerationService::learnFromAiVerdict().
     */
    public function up(): void
    {
        Schema::create('learned_banned_phrases', function (Blueprint $table) {
            $table->id();
            $table->string('phrase')->unique();
            $table->foreignId('comment_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learned_banned_phrases');
    }
};
