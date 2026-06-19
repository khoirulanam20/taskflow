<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_attachments', function (Blueprint $table) {
            $table->string('type', 20)->default('document')->after('task_id');
            $table->text('url')->nullable()->after('original_name');
            $table->longText('content')->nullable()->after('url');
        });

        DB::table('task_attachments')->update(['type' => 'document']);

        Schema::table('task_attachments', function (Blueprint $table) {
            $table->string('path')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('task_attachments', function (Blueprint $table) {
            $table->dropColumn(['type', 'url', 'content']);
            $table->string('path')->nullable(false)->change();
        });
    }
};
