<?php

namespace App\Support\Workspace;

use App\Enums\WorkspaceRole;
use App\Models\Space;
use App\Models\User;

class SpaceAuthorization
{
    public function __construct(private readonly WorkspaceAuthorization $workspaceAuthorization) {}

    public function workspaceRole(User $user, Space $space): ?WorkspaceRole
    {
        $space->loadMissing('workspace');

        return $this->workspaceAuthorization->role($user, $space->workspace);
    }

    public function spaceRole(User $user, Space $space): ?WorkspaceRole
    {
        $member = $user->spaces()
            ->where('spaces.id', $space->id)
            ->first();

        if ($member === null) {
            return null;
        }

        return WorkspaceRole::from($member->pivot->role);
    }

    public function canAccess(User $user, Space $space): bool
    {
        $workspaceRole = $this->workspaceRole($user, $space);
        if ($workspaceRole === null) {
            return false;
        }

        if ($workspaceRole->canManageStructure()) {
            return true;
        }

        return $this->spaceRole($user, $space) !== null;
    }

    public function canManage(User $user, Space $space): bool
    {
        $workspaceRole = $this->workspaceRole($user, $space);
        if ($workspaceRole?->canManageStructure()) {
            return true;
        }

        return $this->spaceRole($user, $space) === WorkspaceRole::Admin;
    }
}
