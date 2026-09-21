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
            $table->unsignedInteger('audio_duration_seconds')->nullable()->after('audio_url');
            $table->unsignedInteger('dj_intro_duration_seconds')->nullable()->after('dj_intro_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news_articles', function (Blueprint $table) {
            $table->dropColumn(['audio_duration_seconds', 'dj_intro_duration_seconds']);
        });
    }
};
