<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Notifications\TaskPmNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class NotifyDueTasksCommand extends Command
{
    protected $signature = 'pm:notify-due-tasks';

    protected $description = 'Kirim notifikasi in-app untuk task yang jatuh tempo besok';

    public function handle(): int
    {
        $dueDate = now()->addDay()->toDateString();
        $count = 0;

        Task::query()
            ->whereDate('due_date', $dueDate)
            ->whereNull('parent_task_id')
            ->with(['assignees', 'taskList.space.workspace'])
            ->chunkById(100, function ($tasks) use (&$count): void {
                foreach ($tasks as $task) {
                    $workspace = $task->taskList?->space?->workspace;
                    if (! $workspace) {
                        continue;
                    }

                    $cacheKey = "pm_due_notified:{$task->id}:{$task->due_date->toDateString()}";
                    if (! Cache::add($cacheKey, true, now()->addDays(2))) {
                        continue;
                    }

                    $url = route('pm.lists.show', [$workspace->slug, $task->task_list_id], false).'?task='.$task->id;
                    $message = "Task \"{$task->title}\" jatuh tempo besok";

                    foreach ($task->assignees as $assignee) {
                        $assignee->notify(new TaskPmNotification(
                            'Deadline mendekati',
                            $message,
                            $url,
                        ));
                        $count++;
                    }
                }
            });

        $this->info("Notifikasi terkirim: {$count}");

        return self::SUCCESS;
    }
}
