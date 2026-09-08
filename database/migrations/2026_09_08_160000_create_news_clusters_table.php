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
        Schema::create('news_clusters', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->text('summary')->nullable();
            $table->string('image_url')->nullable();
            $table->unsignedInteger('sources_count')->default(1);
            $table->float('relevance_score')->default(0);
            $table->string('status')->default('pending');
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('news_clusters');
    }
};
