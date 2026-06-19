<?php

namespace App\Policies\Pm;

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Workspace\WorkspaceAuthorization;

class WorkspacePolicy
{
    public function __construct(private readonly WorkspaceAuthorization $authorization) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Workspace $workspace): bool
    {
        return $this->authorization->isMember($user, $workspace);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Workspace $workspace): bool
    {
        $role = $this->authorization->role($user, $workspace);

        return $role === WorkspaceRole::Owner || $role === WorkspaceRole::Admin;
    }

    public function delete(User $user, Workspace $workspace): bool
    {
        return $this->authorization->role($user, $workspace) === WorkspaceRole::Owner;
    }

    public function manageMembers(User $user, Workspace $workspace): bool
    {
        $role = $this->authorization->role($user, $workspace);

        return $role?->canManageMembers() ?? false;
    }
}
