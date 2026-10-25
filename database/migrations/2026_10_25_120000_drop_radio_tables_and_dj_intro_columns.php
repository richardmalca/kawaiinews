<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('radio_queue_items');
        Schema::dropIfExists('radio_tracks');

        if (Schema::hasColumn('news_articles', 'dj_intro_duration_seconds')) {
            Schema::table('news_articles', function (Blueprint $table) {
                $table->dropColumn('dj_intro_duration_seconds');
            });
        }

        if (Schema::hasColumn('news_articles', 'dj_intro_url')) {
            Schema::table('news_articles', function (Blueprint $table) {
                $table->dropColumn('dj_intro_url');
            });
        }
    }

    public function down(): void
    {
        Schema::table('news_articles', function (Blueprint $table) {
            $table->string('dj_intro_url')->nullable()->after('audio_url');
            $table->unsignedInteger('dj_intro_duration_seconds')->nullable()->after('dj_intro_url');
        });

        Schema::create('radio_tracks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('artist')->nullable();
            $table->string('url');
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('radio_queue_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('position');
            $table->string('type');
            $table->foreignId('radio_track_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('news_article_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('audio_url');
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamps();
        });
    }
};
