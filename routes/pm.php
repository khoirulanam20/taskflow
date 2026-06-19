<?php

use App\Http\Controllers\Pm\PmNavController;
use App\Http\Controllers\Pm\SpaceController;
use App\Http\Controllers\Pm\SpaceMemberController;
use App\Http\Controllers\Pm\SprintController;
use App\Http\Controllers\Pm\TagController;
use App\Http\Controllers\Pm\TaskAttachmentController;
use App\Http\Controllers\Pm\TaskCommentController;
use App\Http\Controllers\Pm\TaskController;
use App\Http\Controllers\Pm\TaskListController;
use App\Http\Controllers\Pm\TaskSubtaskController;
use App\Http\Controllers\Pm\WorkspaceController;
use App\Http\Controllers\Pm\WorkspaceInviteController;
use App\Http\Controllers\Pm\WorkspaceMemberController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('w')->name('pm.')->group(function (): void {
    Route::get('/invites/{token}', [WorkspaceInviteController::class, 'show'])->name('invites.show');
    Route::post('/invites/{token}/accept', [WorkspaceInviteController::class, 'accept'])->name('invites.accept');

    Route::get('/', [WorkspaceController::class, 'index'])->name('workspaces.index');
    Route::post('/workspaces', [WorkspaceController::class, 'store'])->name('workspaces.store');

    Route::middleware('workspace.member')->prefix('{workspace:slug}')->group(function (): void {
        Route::get('/', [WorkspaceController::class, 'show'])->name('workspaces.show');

        Route::get('/settings/members', [WorkspaceMemberController::class, 'index'])->name('settings.members');
        Route::post('/members', [WorkspaceMemberController::class, 'store'])->name('members.store');
        Route::put('/members/{member}', [WorkspaceMemberController::class, 'update'])->name('members.update');
        Route::delete('/members/{member}', [WorkspaceMemberController::class, 'destroy'])->name('members.destroy');

        Route::post('/nav/reorder', [PmNavController::class, 'reorder'])->name('nav.reorder');

        Route::post('/spaces', [SpaceController::class, 'store'])->name('spaces.store');
        Route::put('/spaces/{space}', [SpaceController::class, 'update'])->name('spaces.update');
        Route::delete('/spaces/{space}', [SpaceController::class, 'destroy'])->name('spaces.destroy');
        Route::get('/spaces/{space}/members', [SpaceMemberController::class, 'index'])->name('spaces.members.index');
        Route::post('/spaces/{space}/members', [SpaceMemberController::class, 'store'])->name('spaces.members.store');
        Route::put('/spaces/{space}/members/{member}', [SpaceMemberController::class, 'update'])->name('spaces.members.update');
        Route::delete('/spaces/{space}/members/{member}', [SpaceMemberController::class, 'destroy'])->name('spaces.members.destroy');

        Route::post('/spaces/{space}/sprints', [SprintController::class, 'store'])->name('sprints.store');
        Route::put('/sprints/{sprint}', [SprintController::class, 'update'])->name('sprints.update');
        Route::delete('/sprints/{sprint}', [SprintController::class, 'destroy'])->name('sprints.destroy');
        Route::get('/sprints/{sprint}/board', [SprintController::class, 'board'])->name('sprints.board');
        Route::post('/sprints/{sprint}/close', [SprintController::class, 'close'])->name('sprints.close');

        Route::get('/lists/{taskList}', [TaskController::class, 'show'])->name('lists.show');
        Route::get('/lists/{taskList}/board', [TaskController::class, 'board'])->name('lists.board');
        Route::post('/spaces/{space}/lists', [TaskListController::class, 'store'])->name('lists.store');
        Route::put('/lists/{taskList}', [TaskListController::class, 'update'])->name('lists.update');
        Route::delete('/lists/{taskList}', [TaskListController::class, 'destroy'])->name('lists.destroy');

        Route::post('/lists/{taskList}/tasks', [TaskController::class, 'store'])->name('tasks.store');
        Route::post('/lists/{taskList}/tasks/bulk-status', [TaskController::class, 'bulkStatus'])->name('tasks.bulk-status');
        Route::post('/lists/{taskList}/tasks/reorder', [TaskController::class, 'reorder'])->name('tasks.reorder');
        Route::post('/tags', [TagController::class, 'store'])->name('tags.store');

        Route::post('/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('tasks.comments.store');
        Route::delete('/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'destroy'])->name('tasks.comments.destroy');
        Route::post('/tasks/{task}/subtasks', [TaskSubtaskController::class, 'store'])->name('tasks.subtasks.store');
        Route::delete('/tasks/{task}/subtasks/{subtask}', [TaskSubtaskController::class, 'destroy'])->name('tasks.subtasks.destroy');
        Route::post('/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('tasks.attachments.store');
        Route::get('/tasks/{task}/attachments/{attachment}/preview', [TaskAttachmentController::class, 'preview'])->name('tasks.attachments.preview');
        Route::get('/tasks/{task}/attachments/{attachment}/download', [TaskAttachmentController::class, 'download'])->name('tasks.attachments.download');
        Route::delete('/tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('tasks.attachments.destroy');

        Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
        Route::get('/tasks/{task}/detail', [TaskController::class, 'detail'])->name('tasks.detail');
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    });
});
