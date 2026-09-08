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
        Schema::create('scraped_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_cluster_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('news_source_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('url')->unique();
            $table->text('summary')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scraped_items');
    }
};
