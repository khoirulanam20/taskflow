<?php

namespace App\Support\Workspace;

use App\Models\TaskList;

class DefaultStatusSeeder
{
    /** @var array<int, array{name: string, color: string}> */
    private const DEFAULTS = [
        ['name' => 'To Do', 'color' => '#6F767E'],
        ['name' => 'In Progress', 'color' => '#4B5694'],
        ['name' => 'Review', 'color' => '#F59E0B'],
        ['name' => 'Done', 'color' => '#10B981'],
    ];

    public function seedForList(TaskList $taskList): void
    {
        foreach (self::DEFAULTS as $index => $status) {
            $taskList->statuses()->create([
                'name' => $status['name'],
                'color' => $status['color'],
                'sort_order' => $index,
            ]);
        }
    }
}
