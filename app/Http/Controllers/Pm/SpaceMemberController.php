<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreSpaceMemberRequest;
use App\Http\Requests\Pm\UpdateSpaceMemberRequest;
use App\Models\Space;
use App\Models\SpaceMember;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Workspace\PmInertiaData;
use App\Support\Workspace\WorkspaceAuthorization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SpaceMemberController extends Controller
{
    public function __construct(
        private readonly PmInertiaData $pmData,
        private readonly WorkspaceAuthorization $workspaceAuthorization,
    ) {}

    public function index(Request $request, Workspace $workspace, Space $space): JsonResponse
    {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('manageMembers', $space);

        return response()->json([
            'members' => $this->pmData->membersForSpace($space),
            'candidates' => $this->pmData->membersForWorkspace($workspace),
        ]);
    }

    public function store(
        StoreSpaceMemberRequest $request,
        Workspace $workspace,
        Space $space,
    ): RedirectResponse|JsonResponse {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('manageMembers', $space);

        $target = User::query()
            ->where('email', $request->string('email')->toString())
            ->where('is_active', true)
            ->firstOrFail();

        if (! $this->workspaceAuthorization->isMember($target, $workspace)) {
            return $this->respond($request, back()->withErrors(['email' => 'User harus anggota workspace terlebih dahulu.']));
        }

        if ($space->users()->where('users.id', $target->id)->exists()) {
            return $this->respond($request, back()->withErrors(['email' => 'User sudah menjadi anggota space ini.']));
        }

        SpaceMember::create([
            'space_id' => $space->id,
            'user_id' => $target->id,
            'role' => $request->string('role')->toString(),
        ]);

        return $this->respond($request, back()->with('status', 'created'));
    }

    public function update(
        UpdateSpaceMemberRequest $request,
        Workspace $workspace,
        Space $space,
        User $member,
    ): RedirectResponse|JsonResponse {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('manageMembers', $space);

        $record = $this->findMember($space, $member);
        $record->update(['role' => $request->string('role')->toString()]);

        return $this->respond($request, back()->with('status', 'updated'));
    }

    public function destroy(
        Request $request,
        Workspace $workspace,
        Space $space,
        User $member,
    ): RedirectResponse|JsonResponse {
        $this->ensureSpaceInWorkspace($workspace, $space);
        $this->authorize('manageMembers', $space);

        $this->findMember($space, $member)->delete();

        return $this->respond($request, back()->with('status', 'deleted'));
    }

    private function findMember(Space $space, User $member): SpaceMember
    {
        return SpaceMember::query()
            ->where('space_id', $space->id)
            ->where('user_id', $member->id)
            ->firstOrFail();
    }

    private function ensureSpaceInWorkspace(Workspace $workspace, Space $space): void
    {
        if ($space->workspace_id !== $workspace->id) {
            abort(404);
        }
    }

    private function respond(Request $request, RedirectResponse $response): RedirectResponse|JsonResponse
    {
        if ($request->expectsJson()) {
            return response()->json(['ok' => true]);
        }

        return $response;
    }
}
