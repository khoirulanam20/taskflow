<?php

namespace App\Http\Controllers\Pm;

use App\Http\Controllers\Controller;
use App\Models\WorkspaceInvite;
use App\Models\WorkspaceMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceInviteController extends Controller
{
    public function show(Request $request, string $token): Response|RedirectResponse
    {
        $invite = $this->findPendingInvite($token);

        if ($request->user()?->email !== $invite->email) {
            return Inertia::render('Pm/Invites/Show', [
                'invite' => $this->invitePayload($invite),
                'emailMismatch' => true,
            ]);
        }

        return Inertia::render('Pm/Invites/Show', [
            'invite' => $this->invitePayload($invite),
            'emailMismatch' => false,
        ]);
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $invite = $this->findPendingInvite($token);
        $user = $request->user();

        if ($user?->email !== $invite->email) {
            abort(403, 'Email akun tidak cocok dengan undangan.');
        }

        if ($invite->workspace->users()->where('users.id', $user->id)->exists()) {
            $invite->update(['accepted_at' => now()]);

            return redirect()->route('pm.workspaces.show', $invite->workspace->slug);
        }

        WorkspaceMember::create([
            'workspace_id' => $invite->workspace_id,
            'user_id' => $user->id,
            'role' => $invite->role,
        ]);

        $invite->update(['accepted_at' => now()]);

        return redirect()
            ->route('pm.workspaces.show', $invite->workspace->slug)
            ->with('status', 'joined');
    }

    private function findPendingInvite(string $token): WorkspaceInvite
    {
        $invite = WorkspaceInvite::query()
            ->where('token', $token)
            ->with('workspace')
            ->firstOrFail();

        if (! $invite->isPending()) {
            abort(410, 'Undangan sudah tidak berlaku.');
        }

        return $invite;
    }

    /**
     * @return array<string, mixed>
     */
    private function invitePayload(WorkspaceInvite $invite): array
    {
        return [
            'token' => $invite->token,
            'email' => $invite->email,
            'role' => $invite->role,
            'workspace' => [
                'name' => $invite->workspace->name,
                'slug' => $invite->workspace->slug,
            ],
            'expires_at' => $invite->expires_at->toIso8601String(),
        ];
    }
}
