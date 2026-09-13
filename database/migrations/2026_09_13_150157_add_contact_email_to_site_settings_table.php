<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            // Email de contacto legal/soporte que se muestra en el sitio
            // (privacidad, DMCA, footer). Nullable: si no se carga, cae a
            // "legal@{dominio actual}" — nunca un dominio hardcodeado fijo.
            $table->string('contact_email')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('contact_email');
        });
    }
};
