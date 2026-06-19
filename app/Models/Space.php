<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Space extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'color',
        'icon',
        'sort_order',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function taskLists(): HasMany
    {
        return $this->hasMany(TaskList::class)->orderBy('sort_order');
    }

    public function sprints(): HasMany
    {
        return $this->hasMany(Sprint::class)->orderByDesc('id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(SpaceMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'space_members')
            ->withPivot('role')
            ->withTimestamps();
    }
}
