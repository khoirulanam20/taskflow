<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreTaskListRequest;
use App\Models\Space;
use App\Models\TaskList;
use App\Models\Workspace;
use App\Support\Workspace\DefaultStatusSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class TaskListController extends Controller
{
    public function __construct(private readonly DefaultStatusSeeder $statusSeeder) {}

    public function store(
        StoreTaskListRequest $request,
        Workspace $workspace,
        Space $space,
    ): RedirectResponse {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('create', [TaskList::class, $space]);

        $sortOrder = $space->taskLists()->max('sort_order') + 1;

        $taskList = $space->taskLists()->create([
            'name' => $request->string('name')->toString(),
            'sort_order' => $sortOrder,
        ]);

        $this->statusSeeder->seedForList($taskList);

        return redirect()->route('pm.lists.show', [$workspace, $taskList]);
    }

    public function update(
        StoreTaskListRequest $request,
        Workspace $workspace,
        TaskList $taskList,
    ): RedirectResponse {
        $this->ensureListInWorkspace($workspace, $taskList);
        $this->authorize('update', $taskList);

        $taskList->update([
            'name' => $request->string('name')->toString(),
        ]);

        return back()->with('status', 'updated');
    }

    public function destroy(Workspace $workspace, TaskList $taskList): RedirectResponse
    {
        $this->ensureListInWorkspace($workspace, $taskList);
        $this->authorize('delete', $taskList);

        DB::transaction(function () use ($taskList): void {
            // Tasks reference statuses with restrictOnDelete — hapus task dulu
            $taskList->tasks()->delete();
            $taskList->delete();
        });

        return redirect()->route('pm.workspaces.show', $workspace);
    }

    private function ensureSpaceInWorkspace(Workspace $workspace, Space $space): void
    {
        if ($space->workspace_id !== $workspace->id) {
            abort(404);
        }
    }

    private function ensureListInWorkspace(Workspace $workspace, TaskList $taskList): void
    {
        $taskList->loadMissing('space');
        if ($taskList->space->workspace_id !== $workspace->id) {
            abort(404);
        }
    }
}
