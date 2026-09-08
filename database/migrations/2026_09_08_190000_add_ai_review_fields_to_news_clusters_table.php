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
        Schema::table('news_clusters', function (Blueprint $table) {
            $table->string('ai_verdict')->nullable()->after('status');
            $table->string('ai_reason')->nullable()->after('ai_verdict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news_clusters', function (Blueprint $table) {
            $table->dropColumn(['ai_verdict', 'ai_reason']);
        });
    }
};
