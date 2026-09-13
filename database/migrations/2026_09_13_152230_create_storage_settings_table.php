<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fila única (singleton, igual que site_settings): credenciales de
        // un almacenamiento S3-compatible (Wasabi, DigitalOcean Spaces,
        // AWS S3 real, etc.) configurado y activado desde el panel — nunca
        // en .env, mismo patrón que ya usan los proveedores de IA.
        Schema::create('storage_settings', function (Blueprint $table) {
            $table->id();
            $table->string('access_key')->nullable();
            $table->text('secret_key')->nullable();
            $table->string('bucket')->nullable();
            $table->string('region')->nullable()->default('us-east-1');
            $table->string('endpoint')->nullable();
            $table->boolean('use_path_style_endpoint')->default(true);
            // URL pública base si tienen un dominio/CDN propio delante del
            // bucket; si no se carga, se arma con endpoint+bucket.
            $table->string('public_url')->nullable();
            $table->boolean('active_for_media')->default(false);
            $table->boolean('active_for_backups')->default(false);
            $table->timestamp('last_verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_settings');
    }
};
