<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function store(Request $request, Workspace $workspace): RedirectResponse
    {
        $this->authorizeWorkspaceMember($request, $workspace);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        $workspace->tags()->firstOrCreate(
            ['name' => $data['name']],
            ['color' => $data['color'] ?? '#6F767E'],
        );

        return back();
    }

    private function authorizeWorkspaceMember(Request $request, Workspace $workspace): void
    {
        $isMember = $workspace->users()->where('users.id', $request->user()?->id)->exists();
        if (! $isMember) {
            abort(403);
        }
    }
}
