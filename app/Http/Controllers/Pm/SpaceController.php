<?php

namespace App\Http\Controllers\Pm;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreSpaceRequest;
use App\Models\Space;
use App\Models\SpaceMember;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class SpaceController extends Controller
{
    public function store(StoreSpaceRequest $request, Workspace $workspace): RedirectResponse
    {
        $this->authorize('create', [Space::class, $workspace]);

        $sortOrder = $workspace->spaces()->max('sort_order') + 1;

        $space = $workspace->spaces()->create([
            'name' => $request->string('name')->toString(),
            'color' => $request->string('color')->toString() ?: '#4B5694',
            'sort_order' => $sortOrder,
        ]);

        SpaceMember::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'role' => WorkspaceRole::Admin,
        ]);

        return back()->with('status', 'created');
    }

    public function update(StoreSpaceRequest $request, Workspace $workspace, Space $space): RedirectResponse
    {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('update', $space);

        $space->update([
            'name' => $request->string('name')->toString(),
            'color' => $request->string('color')->toString() ?: $space->color,
        ]);

        return back()->with('status', 'updated');
    }

    public function destroy(Workspace $workspace, Space $space): RedirectResponse
    {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('delete', $space);

        DB::transaction(function () use ($space): void {
            foreach ($space->taskLists as $list) {
                $list->tasks()->delete();
            }
            $space->delete();
        });

        return redirect()->route('pm.workspaces.show', $workspace)->with('status', 'deleted');
    }

    private function ensureSpaceInWorkspace(Workspace $workspace, Space $space): void
    {
        if ($space->workspace_id !== $workspace->id) {
            abort(404);
        }
    }
}
