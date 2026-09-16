<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->boolean('auto_accept_news_enabled')->default(false);
            $table->unsignedTinyInteger('auto_accept_news_daily_limit')->default(2);
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['auto_accept_news_enabled', 'auto_accept_news_daily_limit']);
        });
    }
};
