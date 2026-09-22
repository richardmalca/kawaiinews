<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('card_url')->nullable()->after('url');
        });

        Schema::table('news_articles', function (Blueprint $table) {
            $table->string('featured_image_card_url')->nullable()->after('featured_image');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn('card_url');
        });

        Schema::table('news_articles', function (Blueprint $table) {
            $table->dropColumn('featured_image_card_url');
        });
    }
};
