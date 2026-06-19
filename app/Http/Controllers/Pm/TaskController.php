<?php

namespace App\Http\Controllers\Pm;

use App\Enums\TaskPriority;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\BulkTaskStatusRequest;
use App\Http\Requests\Pm\ReorderTasksRequest;
use App\Http\Requests\Pm\StoreTaskRequest;
use App\Http\Requests\Pm\UpdateTaskRequest;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use App\Models\Workspace;
use App\Notifications\TaskPmNotification;
use App\Support\Workspace\PmInertiaData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(private readonly PmInertiaData $pmData) {}

    public function show(Request $request, Workspace $workspace, TaskList $taskList): Response
    {
        return Inertia::render('Pm/Lists/Show', $this->listPageData($request, $workspace, $taskList));
    }

    public function board(Request $request, Workspace $workspace, TaskList $taskList): Response
    {
        $data = $this->listPageData($request, $workspace, $taskList);
        $tasks = collect($data['tasks']);
        $data['columns'] = collect($data['statuses'])->map(fn ($status) => [
            ...$status,
            'tasks' => $tasks->where('status_id', $status['id'])->values()->all(),
        ])->values()->all();

        return Inertia::render('Pm/Lists/Board', $data);
    }

    public function detail(Workspace $workspace, Task $task): JsonResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);

        $task->load([
            'status',
            'assignees',
            'taskList',
            'subtasks' => fn ($query) => $query->with($this->pmData->subtaskEagerLoads()),
            'comments.user',
            'tags',
            'attachments.uploader',
        ]);

        return response()->json([
            'task' => $this->pmData->taskPayload($task),
            'tags' => $this->pmData->tagsForWorkspace($workspace),
        ]);
    }

    public function store(
        StoreTaskRequest $request,
        Workspace $workspace,
        TaskList $taskList,
    ): RedirectResponse {
        $this->ensureListInWorkspace($workspace, $taskList);
        $this->authorize('create', [Task::class, $taskList]);

        $statusId = $request->integer('status_id') ?: $taskList->statuses()->orderBy('sort_order')->value('id');
        $sortOrder = ($taskList->tasks()->max('sort_order') ?? 0) + 1;

        $task = $taskList->tasks()->create([
            'title' => $request->string('title')->toString(),
            'description' => $request->input('description'),
            'status_id' => $statusId,
            'priority' => $request->enum('priority', TaskPriority::class) ?? TaskPriority::Normal,
            'due_date' => $request->input('due_date'),
            'start_date' => $request->input('start_date'),
            'sort_order' => $sortOrder,
            'created_by' => $request->user()?->id,
        ]);

        $assigneeIds = $request->input('assignee_ids', []);
        if (is_array($assigneeIds) && $assigneeIds !== []) {
            $task->assignees()->sync($assigneeIds);
        }

        return back()->with('status', 'created');
    }

    public function reorder(
        ReorderTasksRequest $request,
        Workspace $workspace,
        TaskList $taskList,
    ): RedirectResponse {
        $this->ensureListInWorkspace($workspace, $taskList);
        $this->authorize('view', $taskList);

        $statusIds = $taskList->statuses()->pluck('sort_order', 'id');
        $seenTaskIds = [];

        foreach ($request->input('columns', []) as $column) {
            $statusId = (int) $column['status_id'];
            if (! $statusIds->has($statusId)) {
                abort(422, 'Status tidak valid untuk list ini.');
            }

            $base = ((int) $statusIds[$statusId]) * 10000;

            foreach ($column['task_ids'] as $index => $taskId) {
                $taskId = (int) $taskId;
                if ($taskId <= 0 || isset($seenTaskIds[$taskId])) {
                    continue;
                }

                $updated = Task::query()
                    ->where('task_list_id', $taskList->id)
                    ->where('id', $taskId)
                    ->update([
                        'status_id' => $statusId,
                        'sort_order' => $base + $index + 1,
                    ]);

                if ($updated) {
                    $seenTaskIds[$taskId] = true;
                }
            }
        }

        return back();
    }

    public function bulkStatus(
        BulkTaskStatusRequest $request,
        Workspace $workspace,
        TaskList $taskList,
    ): RedirectResponse {
        $this->ensureListInWorkspace($workspace, $taskList);
        $this->authorize('view', $taskList);

        $statusId = $request->integer('status_id');
        if (! $taskList->statuses()->where('id', $statusId)->exists()) {
            abort(422, 'Status tidak valid untuk list ini.');
        }

        Task::query()
            ->where('task_list_id', $taskList->id)
            ->whereIn('id', $request->input('task_ids', []))
            ->update(['status_id' => $statusId]);

        return back()->with('status', 'updated');
    }

    public function update(
        UpdateTaskRequest $request,
        Workspace $workspace,
        Task $task,
    ): RedirectResponse {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);

        $payload = $request->validated();
        unset($payload['assignee_ids'], $payload['tag_ids']);

        if ($payload !== []) {
            if (array_key_exists('sprint_id', $payload) && $payload['sprint_id'] !== null) {
                $task->loadMissing('taskList.space');
                $valid = $task->taskList->space->sprints()->where('id', $payload['sprint_id'])->exists();
                if (! $valid) {
                    abort(422);
                }
            }
            $task->update($payload);
        }

        if ($request->has('assignee_ids')) {
            $previousIds = $task->assignees()->pluck('users.id');
            $newIds = collect($request->input('assignee_ids', []))->map(fn ($id) => (int) $id);
            $task->assignees()->sync($newIds->all());
            $this->notifyNewAssignees($task, $workspace, $previousIds, $newIds, $request->user());
        }

        if ($request->has('tag_ids')) {
            $tagIds = $request->input('tag_ids', []);
            $validTagIds = $workspace->tags()->whereIn('id', $tagIds)->pluck('id')->all();
            $task->tags()->sync($validTagIds);
        }

        return back()->with('status', 'updated');
    }

    /**
     * @param  Collection<int, int>  $previousIds
     * @param  Collection<int, int>  $newIds
     */
    private function notifyNewAssignees(
        Task $task,
        Workspace $workspace,
        $previousIds,
        $newIds,
        ?User $actor,
    ): void {
        $added = $newIds->diff($previousIds);
        if ($added->isEmpty()) {
            return;
        }

        $task->loadMissing('taskList');
        $url = $this->pmData->taskNotificationUrl($workspace, $task);

        User::query()->whereIn('id', $added)->get()->each(function (User $user) use ($task, $actor, $url): void {
            if ($actor && $user->id === $actor->id) {
                return;
            }

            $user->notify(new TaskPmNotification(
                'Task ditugaskan',
                ($actor?->name ?? 'Seseorang')." menugaskan kamu ke \"{$task->title}\"",
                $url,
            ));
        });
    }

    public function destroy(Workspace $workspace, Task $task): RedirectResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('delete', $task);

        $task->delete();

        return back()->with('status', 'deleted');
    }

    /**
     * @return array<string, mixed>
     */
    private function listPageData(Request $request, Workspace $workspace, TaskList $taskList): array
    {
        $this->ensureListInWorkspace($workspace, $taskList);
        $this->authorize('view', $taskList);

        $user = $request->user();
        $taskList->load(['space.sprints', 'statuses']);

        $tasks = $this->filteredTasks($request, $taskList)
            ->map(fn (Task $task) => $this->pmData->listTaskPayload($task));

        return [
            'workspace' => $this->pmData->workspacePayload($workspace, $user),
            'workspaces' => $this->pmData->workspacesForUser($user),
            'spaces' => $this->pmData->spacesTree($workspace, $user),
            'members' => $this->pmData->membersForPicker($workspace),
            'currentList' => [
                'id' => $taskList->id,
                'name' => $taskList->name,
                'space_id' => $taskList->space_id,
            ],
            'currentSpace' => [
                'id' => $taskList->space->id,
                'name' => $taskList->space->name,
                'color' => $taskList->space->color,
                'can_manage' => $this->pmData->canManageSpace($taskList->space, $user),
            ],
            'sprints' => $taskList->space->sprints->map(fn ($sprint) => [
                'id' => $sprint->id,
                'name' => $sprint->name,
                'status' => $sprint->status->value,
            ])->values()->all(),
            'statuses' => $taskList->statuses->map(fn ($status) => [
                'id' => $status->id,
                'name' => $status->name,
                'color' => $status->color,
            ])->values()->all(),
            'tasks' => $tasks->values()->all(),
            'filters' => [
                'q' => $request->string('q')->toString(),
                'status_id' => $request->input('status_id'),
                'priority' => $request->input('priority'),
                'assignee_id' => $request->input('assignee_id'),
            ],
            'priorities' => $this->pmData->priorityOptions(),
        ];
    }

    /**
     * @return Collection<int, Task>
     */
    private function filteredTasks(Request $request, TaskList $taskList): Collection
    {
        $query = $taskList->tasks()
            ->with([
                'status',
                'assignees',
                'taskList',
                'subtasks' => function ($query): void {
                    $query->with($this->pmData->listSubtaskEagerLoads());
                },
            ])
            ->whereNull('parent_task_id')
            ->join('statuses', 'tasks.status_id', '=', 'statuses.id')
            ->select('tasks.*')
            ->orderBy('statuses.sort_order')
            ->orderBy('tasks.sort_order');

        if ($request->filled('status_id')) {
            $query->where('tasks.status_id', $request->integer('status_id'));
        }

        if ($request->filled('priority')) {
            $query->where('tasks.priority', $request->string('priority')->toString());
        }

        if ($request->filled('assignee_id')) {
            $query->whereHas('assignees', fn ($q) => $q->where('users.id', $request->integer('assignee_id')));
        }

        if ($request->filled('q')) {
            $q = '%'.$request->string('q')->toString().'%';
            $query->where('tasks.title', 'like', $q);
        }

        return $query->get();
    }

    private function ensureListInWorkspace(Workspace $workspace, TaskList $taskList): void
    {
        $taskList->loadMissing('space');
        if ($taskList->space->workspace_id !== $workspace->id) {
            abort(404);
        }
    }

    private function ensureTaskInWorkspace(Workspace $workspace, Task $task): void
    {
        if (! $task->belongsToWorkspace($workspace)) {
            abort(404);
        }
    }
}
