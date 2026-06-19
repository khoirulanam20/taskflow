<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('space_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('space_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20)->default('member');
            $table->timestamps();

            $table->unique(['space_id', 'user_id']);
            $table->index('user_id');
        });

        // ponytail: mirror workspace membership agar data lama tetap bisa akses space
        $rows = DB::table('workspace_members')
            ->join('spaces', 'spaces.workspace_id', '=', 'workspace_members.workspace_id')
            ->select([
                'spaces.id as space_id',
                'workspace_members.user_id',
                'workspace_members.role',
            ])
            ->get();

        $now = now();
        foreach ($rows as $row) {
            $role = $row->role === 'owner' ? 'admin' : $row->role;
            DB::table('space_members')->insertOrIgnore([
                'space_id' => $row->space_id,
                'user_id' => $row->user_id,
                'role' => $role,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('space_members');
    }
};
