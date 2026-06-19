<?php

namespace App\Http\Requests\Pm;

use Illuminate\Foundation\Http\FormRequest;

class ReorderTasksRequest extends FormRequest
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
            'columns' => ['required', 'array', 'min:1'],
            'columns.*.status_id' => ['required', 'integer', 'exists:statuses,id'],
            'columns.*.task_ids' => ['required', 'array'],
            'columns.*.task_ids.*' => ['integer'],
        ];
    }
}
