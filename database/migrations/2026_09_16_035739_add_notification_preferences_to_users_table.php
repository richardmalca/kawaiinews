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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notify_article_comments')->default(true);
            $table->boolean('notify_comment_replies')->default(true);
            $table->boolean('notify_comment_likes')->default(true);
            $table->boolean('notify_article_reactions')->default(true);
            $table->boolean('notify_followers')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'notify_article_comments',
                'notify_comment_replies',
                'notify_comment_likes',
                'notify_article_reactions',
                'notify_followers',
            ]);
        });
    }
};
