<?php

namespace App\Http\Controllers\Pm;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreWorkspaceRequest;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Support\Workspace\PmInertiaData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function __construct(private readonly PmInertiaData $pmData) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Pm/Workspaces/Index', [
            'workspaces' => $this->pmData->workspacesForUser($user),
        ]);
    }

    public function store(StoreWorkspaceRequest $request): RedirectResponse
    {
        $user = $request->user();
        $name = $request->string('name')->toString();
        $slug = $this->uniqueSlug($name);

        $workspace = Workspace::create([
            'name' => $name,
            'slug' => $slug,
            'owner_id' => $user->id,
        ]);

        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => WorkspaceRole::Owner,
        ]);

        $user->forceFill(['active_workspace_id' => $workspace->id])->save();

        return redirect()->route('pm.workspaces.show', $workspace);
    }

    public function show(Request $request, Workspace $workspace): Response|RedirectResponse
    {
        $this->authorize('view', $workspace);

        $user = $request->user();

        $firstList = collect($this->pmData->spacesTree($workspace, $user))
            ->flatMap(fn (array $space) => $space['task_lists'])
            ->first();

        if ($firstList !== null) {
            return redirect()->route('pm.lists.show', [$workspace, $firstList['id']]);
        }

        return Inertia::render('Pm/Workspaces/Show', [
            'workspace' => $this->pmData->workspacePayload($workspace, $user),
            'workspaces' => $this->pmData->workspacesForUser($user),
            'spaces' => $this->pmData->spacesTree($workspace, $user),
            'members' => $this->pmData->membersForWorkspace($workspace),
        ]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'workspace';
        }

        $slug = $base;
        $counter = 1;

        while (Workspace::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
