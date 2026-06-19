<?php

namespace App\Models;

use App\Enums\SprintStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sprint extends Model
{
    protected $fillable = [
        'space_id',
        'name',
        'start_date',
        'end_date',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'status' => SprintStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function belongsToWorkspace(Workspace $workspace): bool
    {
        $this->loadMissing('space');

        return $this->space?->workspace_id === $workspace->id;
    }
}
