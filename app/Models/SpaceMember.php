<?php

namespace App\Models;

use App\Enums\WorkspaceRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpaceMember extends Model
{
    protected $fillable = [
        'space_id',
        'user_id',
        'role',
    ];

    protected function casts(): array
    {
        return [
            'role' => WorkspaceRole::class,
        ];
    }

    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
