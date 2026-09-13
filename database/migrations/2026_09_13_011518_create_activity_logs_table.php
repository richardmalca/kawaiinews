<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Ej: "news_cluster.accepted", "news_article.updated",
            // "comment.approved". Un string libre en vez de un enum de DB
            // para no tener que migrar cada vez que se agrega una acción
            // nueva a loguear.
            $table->string('action');
            $table->nullableMorphs('subject');
            $table->string('description')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
