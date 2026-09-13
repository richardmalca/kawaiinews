<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fila única (singleton, id 1): no hace falta una tabla clave/valor
        // para un puñado de campos que siempre se editan juntos desde una
        // sola pantalla.
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('KawaiiNews');
            $table->string('description')->nullable();
            $table->json('keywords')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->string('favicon_192_path')->nullable();
            $table->string('apple_touch_icon_path')->nullable();
            $table->string('og_image_path')->nullable();
            $table->string('theme_color', 7)->nullable();
            $table->string('twitter_handle')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
