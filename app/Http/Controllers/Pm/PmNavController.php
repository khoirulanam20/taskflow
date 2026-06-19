<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\ReorderPmNavRequest;
use App\Models\Space;
use App\Models\Sprint;
use App\Models\TaskList;
use App\Models\Workspace;
use App\Support\Workspace\SpaceAuthorization;
use App\Support\Workspace\WorkspaceAuthorization;
use Illuminate\Http\RedirectResponse;

class PmNavController extends Controller
{
    public function __construct(
        private readonly WorkspaceAuthorization $workspaceAuth,
        private readonly SpaceAuthorization $spaceAuth,
    ) {}

    public function reorder(ReorderPmNavRequest $request, Workspace $workspace): RedirectResponse
    {
        $user = $request->user();

        if ($request->has('space_ids')) {
            $role = $this->workspaceAuth->role($user, $workspace);
            if (! $role?->canManageStructure()) {
                abort(403);
            }

            $ids = $request->input('space_ids', []);
            $spaces = $workspace->spaces()->whereIn('id', $ids)->get()->keyBy('id');

            foreach ($ids as $index => $spaceId) {
                $space = $spaces->get((int) $spaceId);
                if ($space) {
                    $space->update(['sort_order' => ($index + 1) * 10]);
                }
            }
        }

        foreach ($request->input('spaces', []) as $column) {
            $spaceId = (int) $column['space_id'];
            $space = Space::query()->where('workspace_id', $workspace->id)->find($spaceId);
            if (! $space || ! $this->spaceAuth->canManage($user, $space)) {
                continue;
            }

            foreach ($column['list_ids'] ?? [] as $index => $listId) {
                TaskList::query()
                    ->where('space_id', $space->id)
                    ->where('id', (int) $listId)
                    ->update(['sort_order' => ($index + 1) * 10]);
            }

            if (array_key_exists('sprint_ids', $column)) {
                foreach ($column['sprint_ids'] as $index => $sprintId) {
                    Sprint::query()
                        ->where('space_id', $space->id)
                        ->where('id', (int) $sprintId)
                        ->update(['sort_order' => ($index + 1) * 10]);
                }
            }
        }

        return back();
    }
}
