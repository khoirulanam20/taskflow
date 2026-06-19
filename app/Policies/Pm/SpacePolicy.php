<?php

namespace App\Policies\Pm;

use App\Models\Space;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Workspace\SpaceAuthorization;
use App\Support\Workspace\WorkspaceAuthorization;

class SpacePolicy
{
    public function __construct(
        private readonly WorkspaceAuthorization $workspaceAuthorization,
        private readonly SpaceAuthorization $spaceAuthorization,
    ) {}

    public function view(User $user, Space $space): bool
    {
        return $this->spaceAuthorization->canAccess($user, $space);
    }

    public function create(User $user, Workspace $workspace): bool
    {
        $role = $this->workspaceAuthorization->role($user, $workspace);

        return $role?->canManageStructure() ?? false;
    }

    public function update(User $user, Space $space): bool
    {
        return $this->spaceAuthorization->canManage($user, $space);
    }

    public function delete(User $user, Space $space): bool
    {
        return $this->spaceAuthorization->canManage($user, $space);
    }

    public function manageMembers(User $user, Space $space): bool
    {
        return $this->spaceAuthorization->canManage($user, $space);
    }
}
