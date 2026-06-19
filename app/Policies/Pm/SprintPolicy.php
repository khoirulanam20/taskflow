<?php

namespace App\Policies\Pm;

use App\Models\Space;
use App\Models\Sprint;
use App\Models\User;
use App\Support\Workspace\SpaceAuthorization;

class SprintPolicy
{
    public function __construct(private readonly SpaceAuthorization $spaceAuthorization) {}

    public function view(User $user, Sprint $sprint): bool
    {
        $sprint->loadMissing('space');

        return $this->spaceAuthorization->canAccess($user, $sprint->space);
    }

    public function create(User $user, Space $space): bool
    {
        return $this->spaceAuthorization->canManage($user, $space);
    }

    public function update(User $user, Sprint $sprint): bool
    {
        return $this->manage($user, $sprint);
    }

    public function delete(User $user, Sprint $sprint): bool
    {
        return $this->manage($user, $sprint);
    }

    public function close(User $user, Sprint $sprint): bool
    {
        return $this->manage($user, $sprint);
    }

    private function manage(User $user, Sprint $sprint): bool
    {
        $sprint->loadMissing('space');

        return $this->spaceAuthorization->canManage($user, $sprint->space);
    }
}
