<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use App\Support\Workspace\WorkspaceAuthorization;
use App\Support\Workspace\WorkspaceContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceMember
{
    public function __construct(
        private readonly WorkspaceContext $workspaceContext,
        private readonly WorkspaceAuthorization $authorization,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $workspace = $request->route('workspace');

        if (! $workspace instanceof Workspace) {
            abort(404);
        }

        $user = $request->user();
        if ($user === null || ! $this->authorization->isMember($user, $workspace)) {
            abort(403);
        }

        $this->workspaceContext->set($workspace);

        if ($user->active_workspace_id !== $workspace->id) {
            $user->forceFill(['active_workspace_id' => $workspace->id])->save();
        }

        return $next($request);
    }
}
