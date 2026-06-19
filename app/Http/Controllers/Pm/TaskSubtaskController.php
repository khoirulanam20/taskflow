<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreTaskRequest;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;

class TaskSubtaskController extends Controller
{
    public function store(
        StoreTaskRequest $request,
        Workspace $workspace,
        Task $task,
    ): RedirectResponse {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);

        $sortOrder = ($task->subtasks()->max('sort_order') ?? 0) + 1;

        $subtask = $task->subtasks()->create([
            'task_list_id' => $task->task_list_id,
            'title' => $request->string('title')->toString(),
            'status_id' => $task->status_id,
            'priority' => $request->input('priority', $task->priority->value),
            'due_date' => $request->input('due_date'),
            'sort_order' => $sortOrder,
            'created_by' => $request->user()?->id,
        ]);

        $subtask->assignees()->sync($request->input('assignee_ids', []));

        return back()->with('status', 'created');
    }

    public function destroy(Workspace $workspace, Task $task, Task $subtask): RedirectResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);

        if ($subtask->parent_task_id !== $task->id) {
            abort(404);
        }

        $this->authorize('delete', $subtask);
        $subtask->delete();

        return back()->with('status', 'deleted');
    }

    private function ensureTaskInWorkspace(Workspace $workspace, Task $task): void
    {
        if (! $task->belongsToWorkspace($workspace)) {
            abort(404);
        }
    }
}
