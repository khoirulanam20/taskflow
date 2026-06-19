<?php

namespace App\Policies\Pm;

use App\Models\Space;
use App\Models\TaskList;
use App\Models\User;
use App\Support\Workspace\SpaceAuthorization;

class TaskListPolicy
{
    public function __construct(private readonly SpaceAuthorization $spaceAuthorization) {}

    public function view(User $user, TaskList $taskList): bool
    {
        $taskList->loadMissing('space');

        return $this->spaceAuthorization->canAccess($user, $taskList->space);
    }

    public function create(User $user, Space $space): bool
    {
        return $this->spaceAuthorization->canManage($user, $space);
    }

    public function update(User $user, TaskList $taskList): bool
    {
        return $this->manageStructure($user, $taskList);
    }

    public function delete(User $user, TaskList $taskList): bool
    {
        return $this->manageStructure($user, $taskList);
    }

    private function manageStructure(User $user, TaskList $taskList): bool
    {
        $taskList->loadMissing('space');

        return $this->spaceAuthorization->canManage($user, $taskList->space);
    }
}
