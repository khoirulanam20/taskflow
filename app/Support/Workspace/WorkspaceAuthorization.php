<?php

namespace App\Support\Workspace;

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Models\Workspace;

class WorkspaceAuthorization
{
    public function role(User $user, Workspace $workspace): ?WorkspaceRole
    {
        $member = $user->workspaces()
            ->where('workspaces.id', $workspace->id)
            ->first();

        if ($member === null) {
            return null;
        }

        return WorkspaceRole::from($member->pivot->role);
    }

    public function isMember(User $user, Workspace $workspace): bool
    {
        return $this->role($user, $workspace) !== null;
    }
}
