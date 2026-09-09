<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news_articles', function (Blueprint $table) {
            $table->index(['status', 'published_at']);
            $table->index('category');
        });

        Schema::table('news_clusters', function (Blueprint $table) {
            $table->index('status');
            $table->index(['category', 'status']);
            $table->index('relevance_score');
        });
    }

    public function down(): void
    {
        Schema::table('news_articles', function (Blueprint $table) {
            $table->dropIndex(['status', 'published_at']);
            $table->dropIndex(['category']);
        });

        Schema::table('news_clusters', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['category', 'status']);
            $table->dropIndex(['relevance_score']);
        });
    }
};
