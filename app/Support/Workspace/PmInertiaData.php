<?php

namespace App\Support\Workspace;

use App\Enums\TaskPriority;
use App\Enums\WorkspaceRole;
use App\Models\Space;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvite;

class PmInertiaData
{
    public function __construct(
        private readonly WorkspaceAuthorization $authorization,
        private readonly SpaceAuthorization $spaceAuthorization,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function subtaskEagerLoads(): array
    {
        return [
            'status',
            'assignees',
            'comments.user',
            'attachments.uploader',
            'tags',
            'subtasks' => function ($query): void {
                $query->with($this->subtaskEagerLoads());
            },
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, slug: string, role: string}>
     */
    public function workspacesForUser(User $user): array
    {
        return $user->workspaces()
            ->orderBy('name')
            ->get()
            ->map(fn (Workspace $workspace) => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'role' => $this->authorization->role($user, $workspace)?->value ?? 'member',
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function spacesTree(Workspace $workspace, User $user): array
    {
        return $workspace->spaces()
            ->with([
                'taskLists' => fn ($q) => $q->orderBy('sort_order'),
                'sprints' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (Space $space) => $this->spaceAuthorization->canAccess($user, $space))
            ->map(fn (Space $space) => [
                'id' => $space->id,
                'name' => $space->name,
                'color' => $space->color,
                'icon' => $space->icon,
                'can_manage' => $this->spaceAuthorization->canManage($user, $space),
                'role' => $this->spaceAuthorization->spaceRole($user, $space)?->value
                    ?? $this->spaceAuthorization->workspaceRole($user, $space)?->value,
                'task_lists' => $space->taskLists->map(fn ($list) => [
                    'id' => $list->id,
                    'name' => $list->name,
                    'space_id' => $list->space_id,
                ])->values()->all(),
                'sprints' => $space->sprints->map(fn ($sprint) => [
                    'id' => $sprint->id,
                    'name' => $sprint->name,
                    'status' => $sprint->status->value,
                    'start_date' => $sprint->start_date?->format('Y-m-d'),
                    'end_date' => $sprint->end_date?->format('Y-m-d'),
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string, email: string, avatar_url: string|null, avatar_initial: string, role: string}>
     */
    public function membersForWorkspace(Workspace $workspace): array
    {
        return $workspace->users()
            ->orderBy('name')
            ->get()
            ->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'username' => $member->username,
                'avatar_url' => $member->avatarUrl(),
                'avatar_initial' => $member->avatarInitial(),
                'role' => WorkspaceRole::from($member->pivot->role)->value,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string, username: string|null, avatar_url: string|null, avatar_initial: string}>
     */
    public function membersForPicker(Workspace $workspace): array
    {
        return $workspace->users()
            ->orderBy('name')
            ->get(['users.id', 'users.name', 'users.username', 'users.avatar_path'])
            ->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'username' => $member->username,
                'avatar_url' => $member->avatarUrl(),
                'avatar_initial' => $member->avatarInitial(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, email: string, role: string, expires_at: string}>
     */
    public function pendingInvitesForWorkspace(Workspace $workspace): array
    {
        return WorkspaceInvite::query()
            ->where('workspace_id', $workspace->id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->orderBy('email')
            ->get()
            ->map(fn (WorkspaceInvite $invite) => [
                'id' => $invite->id,
                'email' => $invite->email,
                'role' => $invite->role,
                'expires_at' => $invite->expires_at->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string, email: string, avatar_url: string|null, avatar_initial: string, role: string}>
     */
    public function membersForSpace(Space $space): array
    {
        return $space->users()
            ->orderBy('name')
            ->get()
            ->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'username' => $member->username,
                'avatar_url' => $member->avatarUrl(),
                'avatar_initial' => $member->avatarInitial(),
                'role' => WorkspaceRole::from($member->pivot->role)->value,
            ])
            ->values()
            ->all();
    }

    public function workspacePayload(Workspace $workspace, User $user): array
    {
        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'slug' => $workspace->slug,
            'role' => $this->authorization->role($user, $workspace)?->value,
        ];
    }

    public function canManageSpace(Space $space, User $user): bool
    {
        return $this->spaceAuthorization->canManage($user, $space);
    }

    /**
     * @return array<int, array{id: int, name: string, color: string}>
     */
    public function tagsForWorkspace(Workspace $workspace): array
    {
        return $workspace->tags()
            ->orderBy('name')
            ->get()
            ->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'color' => $tag->color,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function listSubtaskEagerLoads(): array
    {
        return [
            'status',
            'assignees',
            'subtasks' => function ($query): void {
                $query->with($this->listSubtaskEagerLoads());
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function listTaskPayload(Task $task): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'status_id' => $task->status_id,
            'sprint_id' => $task->sprint_id,
            'priority' => $task->priority->value,
            'due_date' => $task->due_date?->format('Y-m-d'),
            'start_date' => $task->start_date?->format('Y-m-d'),
            'assignees' => $task->assignees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar_url' => $user->avatarUrl(),
                'avatar_initial' => $user->avatarInitial(),
            ])->values()->all(),
            'status' => $task->status ? [
                'id' => $task->status->id,
                'name' => $task->status->name,
                'color' => $task->status->color,
            ] : null,
            'list_name' => $task->taskList?->name,
            'subtasks' => $task->relationLoaded('subtasks')
                ? $task->subtasks->map(fn (Task $subtask) => $this->listTaskPayload($subtask))->values()->all()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function taskPayload(Task $task): array
    {
        return [
            ...$this->listTaskPayload($task),
            'description' => $task->description,
            'comments' => $task->relationLoaded('comments')
                ? $task->comments->map(fn ($comment) => [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'created_at' => $comment->created_at?->toIso8601String(),
                    'user' => $comment->user ? [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                        'avatar_url' => $comment->user->avatarUrl(),
                        'avatar_initial' => $comment->user->avatarInitial(),
                    ] : null,
                ])->values()->all()
                : [],
            'tags' => $task->relationLoaded('tags')
                ? $task->tags->map(fn ($tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'color' => $tag->color,
                ])->values()->all()
                : [],
            'attachments' => $task->relationLoaded('attachments')
                ? $task->attachments->map(fn ($file) => [
                    'id' => $file->id,
                    'type' => $file->type->value,
                    'original_name' => $file->original_name,
                    'url' => $file->url,
                    'size' => $file->size,
                    'mime_type' => $file->mime_type,
                    'created_at' => $file->created_at?->toIso8601String(),
                    'uploader' => $file->uploader ? [
                        'id' => $file->uploader->id,
                        'name' => $file->uploader->name,
                    ] : null,
                ])->values()->all()
                : [],
        ];
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public function priorityOptions(): array
    {
        return collect(TaskPriority::cases())->map(fn (TaskPriority $p) => [
            'value' => $p->value,
            'label' => $p->label(),
        ])->values()->all();
    }

    public function taskNotificationUrl(Workspace $workspace, Task $task): string
    {
        return route('pm.lists.show', [$workspace->slug, $task->task_list_id], false).'?task='.$task->id;
    }
}
