<?php

namespace App\Models;

use App\Enums\TaskAttachmentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskAttachment extends Model
{
    protected $fillable = [
        'task_id',
        'type',
        'uploaded_by',
        'original_name',
        'url',
        'content',
        'path',
        'mime_type',
        'size',
    ];

    protected function casts(): array
    {
        return [
            'type' => TaskAttachmentType::class,
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isPdf(): bool
    {
        if ($this->mime_type === 'application/pdf') {
            return true;
        }

        return str_ends_with(strtolower($this->original_name), '.pdf');
    }

    public function isWordDocument(): bool
    {
        $mime = $this->mime_type ?? '';
        if (in_array($mime, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ], true)) {
            return true;
        }

        $name = strtolower($this->original_name);

        return str_ends_with($name, '.doc') || str_ends_with($name, '.docx');
    }
}
