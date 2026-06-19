<?php

namespace App\Http\Controllers\Pm;

use App\Enums\SprintStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreSprintRequest;
use App\Models\Space;
use App\Models\Sprint;
use App\Models\Status;
use App\Models\Task;
use App\Models\Workspace;
use App\Support\Workspace\PmInertiaData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SprintController extends Controller
{
    public function __construct(private readonly PmInertiaData $pmData) {}

    public function store(StoreSprintRequest $request, Workspace $workspace, Space $space): RedirectResponse
    {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('create', [Sprint::class, $space]);

        $space->sprints()->create([
            'name' => $request->string('name')->toString(),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'status' => $request->enum('status', SprintStatus::class) ?? SprintStatus::Planned,
            'sort_order' => ($space->sprints()->max('sort_order') ?? 0) + 10,
        ]);

        return back()->with('status', 'created');
    }

    public function update(
        StoreSprintRequest $request,
        Workspace $workspace,
        Sprint $sprint,
    ): RedirectResponse {
        $this->ensureSprintInWorkspace($workspace, $sprint);
        $this->authorize('update', $sprint);

        $sprint->update($request->validated());

        return back()->with('status', 'updated');
    }

    public function destroy(Workspace $workspace, Sprint $sprint): RedirectResponse
    {
        $this->ensureSprintInWorkspace($workspace, $sprint);
        $this->authorize('delete', $sprint);

        $sprint->tasks()->update(['sprint_id' => null]);
        $sprint->delete();

        return redirect()->route('pm.workspaces.show', $workspace)->with('status', 'deleted');
    }

    public function board(Request $request, Workspace $workspace, Sprint $sprint): Response
    {
        $this->ensureSprintInWorkspace($workspace, $sprint);
        $this->authorize('view', $sprint);

        $user = $request->user();
        $sprint->load(['space.taskLists', 'space.sprints']);

        $listIds = $sprint->space->taskLists->pluck('id');

        $statuses = Status::query()
            ->whereIn('task_list_id', $listIds)
            ->orderBy('sort_order')
            ->get()
            ->unique('name')
            ->values();

        $taskModels = Task::query()
            ->with([
                'status',
                'assignees',
                'taskList',
                'subtasks' => function ($query): void {
                    $query->with($this->pmData->listSubtaskEagerLoads());
                },
            ])
            ->where('sprint_id', $sprint->id)
            ->whereNull('parent_task_id')
            ->orderBy('sort_order')
            ->get();

        $tasks = $taskModels->map(fn (Task $task) => $this->pmData->listTaskPayload($task));

        $done = $taskModels->filter(
            fn (Task $task) => strcasecmp($task->status?->name ?? '', 'Done') === 0
        )->count();

        $statusPayload = $statuses->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'color' => $s->color,
        ])->values()->all();

        return Inertia::render('Pm/Sprints/Board', [
            'workspace' => $this->pmData->workspacePayload($workspace, $user),
            'workspaces' => $this->pmData->workspacesForUser($user),
            'spaces' => $this->pmData->spacesTree($workspace, $user),
            'sprint' => [
                'id' => $sprint->id,
                'name' => $sprint->name,
                'status' => $sprint->status->value,
                'space_id' => $sprint->space_id,
                'start_date' => $sprint->start_date?->format('Y-m-d'),
                'end_date' => $sprint->end_date?->format('Y-m-d'),
            ],
            'statuses' => $statusPayload,
            'columns' => collect($statusPayload)->map(fn ($status) => [
                ...$status,
                'tasks' => $tasks->where('status_id', $status['id'])->values()->all(),
            ])->values()->all(),
            'summary' => [
                'total' => $taskModels->count(),
                'done' => $done,
            ],
            'members' => $this->pmData->membersForPicker($workspace),
            'sprints' => $sprint->space->sprints->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'status' => $s->status->value,
            ])->values()->all(),
            'priorities' => $this->pmData->priorityOptions(),
        ]);
    }

    public function close(Workspace $workspace, Sprint $sprint): RedirectResponse
    {
        $this->ensureSprintInWorkspace($workspace, $sprint);
        $this->authorize('close', $sprint);

        $tasks = $sprint->tasks()->with('status')->get();
        $done = 0;

        foreach ($tasks as $task) {
            if (strcasecmp($task->status?->name ?? '', 'Done') === 0) {
                $done++;
            } else {
                $task->update(['sprint_id' => null]);
            }
        }

        $sprint->update(['status' => SprintStatus::Completed]);

        return back()->with('status', 'sprint-closed')->with('sprint_summary', [
            'done' => $done,
            'total' => $tasks->count(),
        ]);
    }

    private function ensureSpaceInWorkspace(Workspace $workspace, Space $space): void
    {
        if ($space->workspace_id !== $workspace->id) {
            abort(404);
        }
    }

    private function ensureSprintInWorkspace(Workspace $workspace, Sprint $sprint): void
    {
        if (! $sprint->belongsToWorkspace($workspace)) {
            abort(404);
        }
    }
}
