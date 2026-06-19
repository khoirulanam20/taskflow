<?php

namespace App\Http\Controllers\Pm;

use App\Enums\TaskAttachmentType;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskAttachmentController extends Controller
{
    private const MAX_KB = 10240;

    public function store(Request $request, Workspace $workspace, Task $task): RedirectResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);

        $type = $request->enum('type', TaskAttachmentType::class);
        if (! $type) {
            abort(422, 'Invalid attachment type.');
        }

        return match ($type) {
            TaskAttachmentType::Link => $this->storeLink($request, $task),
            TaskAttachmentType::Document => $this->storeDocument($request, $workspace, $task),
            TaskAttachmentType::Markdown => $this->storeMarkdown($request, $workspace, $task),
        };
    }

    public function preview(Workspace $workspace, Task $task, TaskAttachment $attachment): JsonResponse|StreamedResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);
        $this->ensureAttachmentBelongsToTask($task, $attachment);

        return match ($attachment->type) {
            TaskAttachmentType::Link => response()->json([
                'type' => 'link',
                'title' => $attachment->original_name,
                'url' => $attachment->url,
            ]),
            TaskAttachmentType::Document => $this->previewDocument($attachment),
            TaskAttachmentType::Markdown => response()->json([
                'type' => 'markdown',
                'title' => $attachment->original_name,
                'content' => $this->markdownContent($attachment),
            ]),
        };
    }

    public function download(Workspace $workspace, Task $task, TaskAttachment $attachment): StreamedResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);
        $this->ensureAttachmentBelongsToTask($task, $attachment);

        if (! $attachment->path) {
            abort(404);
        }

        return Storage::disk('local')->download($attachment->path, $attachment->original_name);
    }

    public function destroy(Workspace $workspace, Task $task, TaskAttachment $attachment): RedirectResponse
    {
        $this->ensureTaskInWorkspace($workspace, $task);
        $this->authorize('update', $task);
        $this->ensureAttachmentBelongsToTask($task, $attachment);

        if ($attachment->path) {
            Storage::disk('local')->delete($attachment->path);
        }

        $attachment->delete();

        return back()->with('status', 'deleted');
    }

    private function storeLink(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::enum(TaskAttachmentType::class)],
            'url' => ['required', 'url', 'regex:/^https?:\/\//i'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $url = $validated['url'];
        $title = $validated['title'] ?? parse_url($url, PHP_URL_HOST) ?? $url;

        $task->attachments()->create([
            'type' => TaskAttachmentType::Link,
            'uploaded_by' => $request->user()?->id,
            'original_name' => $title,
            'url' => $url,
            'path' => null,
            'mime_type' => null,
            'size' => 0,
        ]);

        return back()->with('status', 'created');
    }

    private function storeDocument(Request $request, Workspace $workspace, Task $task): RedirectResponse
    {
        $request->validate([
            'type' => ['required', Rule::enum(TaskAttachmentType::class)],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:'.self::MAX_KB],
        ]);

        $file = $request->file('file');
        $path = $file->store("pm/{$workspace->id}/tasks/{$task->id}", 'local');

        $task->attachments()->create([
            'type' => TaskAttachmentType::Document,
            'uploaded_by' => $request->user()?->id,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize() ?: 0,
        ]);

        return back()->with('status', 'created');
    }

    private function storeMarkdown(Request $request, Workspace $workspace, Task $task): RedirectResponse
    {
        $request->validate([
            'type' => ['required', Rule::enum(TaskAttachmentType::class)],
            'mode' => ['required', Rule::in(['upload', 'paste'])],
        ]);

        if ($request->input('mode') === 'paste') {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'content' => ['required', 'string', 'max:512000'],
            ]);

            $task->attachments()->create([
                'type' => TaskAttachmentType::Markdown,
                'uploaded_by' => $request->user()?->id,
                'original_name' => $validated['title'],
                'content' => $validated['content'],
                'path' => null,
                'mime_type' => 'text/markdown',
                'size' => strlen($validated['content']),
            ]);

            return back()->with('status', 'created');
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:'.self::MAX_KB,
                function (string $attribute, UploadedFile $value, \Closure $fail): void {
                    $ext = strtolower($value->getClientOriginalExtension());
                    if (! in_array($ext, ['md', 'txt'], true)) {
                        $fail('File harus berformat .md atau .txt.');
                    }
                },
            ],
        ]);

        $file = $request->file('file');
        $path = $file->store("pm/{$workspace->id}/tasks/{$task->id}", 'local');

        $task->attachments()->create([
            'type' => TaskAttachmentType::Markdown,
            'uploaded_by' => $request->user()?->id,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType() ?: 'text/markdown',
            'size' => $file->getSize() ?: 0,
        ]);

        return back()->with('status', 'created');
    }

    private function previewDocument(TaskAttachment $attachment): JsonResponse|StreamedResponse
    {
        if (! $attachment->path) {
            abort(404);
        }

        if ($attachment->isWordDocument()) {
            return response()->json([
                'type' => 'document',
                'title' => $attachment->original_name,
                'previewable' => false,
            ]);
        }

        if (! $attachment->isPdf()) {
            abort(404);
        }

        return Storage::disk('local')->response(
            $attachment->path,
            $attachment->original_name,
            ['Content-Disposition' => 'inline; filename="'.$attachment->original_name.'"'],
        );
    }

    private function markdownContent(TaskAttachment $attachment): string
    {
        if ($attachment->content) {
            return $attachment->content;
        }

        if ($attachment->path) {
            return Storage::disk('local')->get($attachment->path) ?: '';
        }

        return '';
    }

    private function ensureTaskInWorkspace(Workspace $workspace, Task $task): void
    {
        if (! $task->belongsToWorkspace($workspace)) {
            abort(404);
        }
    }

    private function ensureAttachmentBelongsToTask(Task $task, TaskAttachment $attachment): void
    {
        if ($attachment->task_id !== $task->id) {
            abort(404);
        }
    }
}
