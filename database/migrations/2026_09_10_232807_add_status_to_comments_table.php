<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `visible` (default) se ve al público; `pending` lo agarró el filtro
     * automático (ver CommentModerationService) y queda oculto hasta que
     * un admin lo apruebe o lo borre desde /admin/comments.
     */
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->string('status')->default('visible')->after('is_spoiler');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
