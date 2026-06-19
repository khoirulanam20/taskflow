<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreTaskCommentRequest;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Models\Workspace;
use App\Notifications\TaskPmNotification;
use App\Support\Workspace\PmInertiaData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class TaskCommentController extends Controller
{
    public function __construct(private readonly PmInertiaData $pmData) {}

    public function store(
        StoreTaskCommentRequest $request,
        Workspace $workspace,
        Task $task,
    ): RedirectResponse {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);

        $actor = $request->user();
        $body = $request->string('body')->toString();

        $comment = $task->comments()->create([
            'user_id' => $actor->id,
            'body' => $body,
        ]);

        $this->notifyForComment($task, $actor, $workspace, $comment, $body);

        return back()->with('status', 'created');
    }

    public function destroy(Workspace $workspace, Task $task, TaskComment $comment): RedirectResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);

        if ($comment->task_id !== $task->id) {
            abort(404);
        }

        $user = request()->user();
        $task->loadMissing('taskList.space');
        if ($comment->user_id !== $user?->id && ! $this->pmData->canManageSpace($task->taskList->space, $user)) {
            abort(403);
        }

        $comment->delete();

        return back()->with('status', 'deleted');
    }

    private function notifyForComment(
        Task $task,
        User $actor,
        Workspace $workspace,
        TaskComment $comment,
        string $body,
    ): void {
        $task->loadMissing(['assignees', 'creator', 'comments']);
        $url = $this->pmData->taskNotificationUrl($workspace, $task);
        $snippet = Str::limit($body, 120);

        $mentionedUsernames = [];
        if (preg_match_all('/@([\w.\-]+)/', $body, $matches)) {
            $mentionedUsernames = array_unique($matches[1]);
        }

        $mentionedUsers = $mentionedUsernames === []
            ? collect()
            : $workspace->users()->whereIn('username', $mentionedUsernames)->get();

        $recipientIds = collect()
            ->merge($task->assignees->pluck('id'))
            ->merge($task->created_by ? [$task->created_by] : [])
            ->merge($task->comments->pluck('user_id'))
            ->merge($mentionedUsers->pluck('id'))
            ->filter()
            ->unique()
            ->reject(fn (int $id) => $id === $actor->id);

        if ($recipientIds->isEmpty()) {
            return;
        }

        $mentionedIds = $mentionedUsers->pluck('id')->flip();

        User::query()
            ->whereIn('id', $recipientIds)
            ->get()
            ->each(function (User $user) use ($actor, $task, $url, $snippet, $mentionedIds): void {
                $isMention = $mentionedIds->has($user->id);

                $user->notify(new TaskPmNotification(
                    $isMention ? 'Kamu disebut di komentar' : 'Komentar baru',
                    $isMention
                        ? "{$actor->name} menyebut kamu di \"{$task->title}\": {$snippet}"
                        : "{$actor->name} mengomentari \"{$task->title}\": {$snippet}",
                    $url,
                ));
            });
    }

    private function ensureTaskInWorkspace(Workspace $workspace, Task $task): void
    {
        if (! $task->belongsToWorkspace($workspace)) {
            abort(404);
        }
    }
}
