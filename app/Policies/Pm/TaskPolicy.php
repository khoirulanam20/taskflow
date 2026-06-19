<?php

namespace App\Policies\Pm;

use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use App\Support\Workspace\SpaceAuthorization;

class TaskPolicy
{
    public function __construct(private readonly SpaceAuthorization $spaceAuthorization) {}

    public function create(User $user, TaskList $taskList): bool
    {
        $taskList->loadMissing('space');

        return $this->spaceAuthorization->canAccess($user, $taskList->space);
    }

    public function update(User $user, Task $task): bool
    {
        return $this->canAccessTask($user, $task);
    }

    public function delete(User $user, Task $task): bool
    {
        return $this->canAccessTask($user, $task);
    }

    private function canAccessTask(User $user, Task $task): bool
    {
        $task->loadMissing('taskList.space');

        return $this->spaceAuthorization->canAccess($user, $task->taskList->space);
    }
}
