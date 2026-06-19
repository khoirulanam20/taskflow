<?php

namespace App\Http\Controllers\Pm;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pm\StoreWorkspaceMemberRequest;
use App\Http\Requests\Pm\UpdateWorkspaceMemberRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvite;
use App\Models\WorkspaceMember;
use App\Notifications\WorkspaceInviteNotification;
use App\Support\Workspace\PmInertiaData;
use App\Support\Workspace\WorkspaceAuthorization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class WorkspaceMemberController extends Controller
{
    public function __construct(
        private readonly PmInertiaData $pmData,
        private readonly WorkspaceAuthorization $authorization,
    ) {}

    public function index(Request $request, Workspace $workspace): JsonResponse|RedirectResponse
    {
        $this->authorize('manageMembers', $workspace);

        if (! $request->expectsJson()) {
            return redirect()->route('pm.workspaces.show', $workspace);
        }

        return response()->json([
            'members' => $this->pmData->membersForWorkspace($workspace),
            'pendingInvites' => $this->pmData->pendingInvitesForWorkspace($workspace),
        ]);
    }

    public function store(StoreWorkspaceMemberRequest $request, Workspace $workspace): RedirectResponse
    {
        $this->authorize('manageMembers', $workspace);

        $email = $request->string('email')->toString();
        $role = $request->string('role')->toString();

        $target = User::query()
            ->where('email', $email)
            ->where('is_active', true)
            ->first();

        if ($target && $this->authorization->isMember($target, $workspace)) {
            return back()->withErrors(['email' => 'User sudah menjadi anggota workspace ini.']);
        }

        if (WorkspaceInvite::query()
            ->where('workspace_id', $workspace->id)
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->exists()) {
            return back()->withErrors(['email' => 'Undangan untuk email ini masih menunggu.']);
        }

        if ($target) {
            WorkspaceMember::create([
                'workspace_id' => $workspace->id,
                'user_id' => $target->id,
                'role' => $role,
            ]);

            return back()->with('status', 'created');
        }

        $invite = WorkspaceInvite::create([
            'workspace_id' => $workspace->id,
            'email' => $email,
            'role' => $role,
            'token' => WorkspaceInvite::makeToken(),
            'invited_by' => $request->user()?->id,
            'expires_at' => now()->addDays(7),
        ]);

        Notification::route('mail', $email)
            ->notify(new WorkspaceInviteNotification(
                $workspace,
                $invite->token,
                $request->user()?->name ?? 'Admin',
            ));

        return back()->with('status', 'invited');
    }

    public function update(
        UpdateWorkspaceMemberRequest $request,
        Workspace $workspace,
        User $member,
    ): RedirectResponse {
        $this->authorize('manageMembers', $workspace);

        $record = $this->findMember($workspace, $member);

        if ($record->role === WorkspaceRole::Owner) {
            abort(403, 'Tidak bisa mengubah role owner.');
        }

        $record->update(['role' => $request->string('role')->toString()]);

        return back()->with('status', 'updated');
    }

    public function destroy(Workspace $workspace, User $member): RedirectResponse
    {
        $this->authorize('manageMembers', $workspace);

        $record = $this->findMember($workspace, $member);

        if ($record->role === WorkspaceRole::Owner) {
            abort(403, 'Tidak bisa menghapus owner.');
        }

        $record->delete();

        return back()->with('status', 'deleted');
    }

    private function findMember(Workspace $workspace, User $member): WorkspaceMember
    {
        return WorkspaceMember::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $member->id)
            ->firstOrFail();
    }
}
