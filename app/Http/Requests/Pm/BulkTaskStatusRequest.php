<?php

namespace App\Http\Requests\Pm;

use Illuminate\Foundation\Http\FormRequest;

class BulkTaskStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['integer', 'exists:tasks,id'],
            'status_id' => ['required', 'integer', 'exists:statuses,id'],
        ];
    }
}
