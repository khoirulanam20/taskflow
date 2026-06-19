<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sprints', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('status');
            $table->index(['space_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::table('sprints', function (Blueprint $table) {
            $table->dropIndex(['space_id', 'sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};
