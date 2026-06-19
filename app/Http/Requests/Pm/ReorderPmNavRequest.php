<?php

namespace App\Http\Requests\Pm;

use Illuminate\Foundation\Http\FormRequest;

class ReorderPmNavRequest extends FormRequest
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
            'space_ids' => ['sometimes', 'array'],
            'space_ids.*' => ['integer'],
            'spaces' => ['sometimes', 'array'],
            'spaces.*.space_id' => ['required', 'integer'],
            'spaces.*.list_ids' => ['array'],
            'spaces.*.list_ids.*' => ['integer'],
            'spaces.*.sprint_ids' => ['array'],
            'spaces.*.sprint_ids.*' => ['integer'],
        ];
    }
}
