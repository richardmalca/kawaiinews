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
        Schema::create('trivia_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trivia_question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trivia_option_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_correct');
            $table->timestamps();

            // Un usuario solo responde una vez cada pregunta del día.
            $table->unique(['user_id', 'trivia_question_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trivia_answers');
    }
};
