<?php

namespace App\Http\Middleware;

use App\Support\Inertia\SharedDataProvider;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $shared = app(SharedDataProvider::class);
        $domain = $shared->navigationDomain();
        $user = $request->user();
        $user?->load('roles');
        $isPm = $request->is('w', 'w/*');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar_url' => $user->avatarUrl(),
                    'avatar_initial' => $user->avatarInitial(),
                    'roles' => $user->roles->pluck('name')->values()->all(),
                    'completed_tours' => $isPm ? [] : (($user->preferences ?? [])['tours'] ?? []),
                ] : null,
                'permissions' => $isPm
                    ? ($user?->getAllPermissions()->pluck('name')->intersect([
                        'notifications.list',
                        'notifications.read',
                        'profile.read',
                        'profile.list',
                        'profile.update',
                    ])->values()->all() ?? [])
                    : ($user?->getAllPermissions()->pluck('name')->values()->all() ?? []),
            ],
            'app' => [
                'name' => $shared->appDisplayName(),
                'theme' => $shared->themeColors(),
                'logoUrl' => $shared->webLogoUrl(),
                'faviconUrl' => $shared->webFaviconUrl(),
                'googleOAuthEnabled' => $shared->googleOAuthEnabled(),
            ],
            'sidebarNavigation' => $isPm
                ? ['groups' => [], 'ungrouped' => []]
                : $shared->sidebarNavigation($domain),
            'dynamicMenus' => $isPm ? [] : $shared->dynamicMenus($domain),
            'impersonating' => $request->session()->has('impersonator_id'),
            'flash' => $shared->flashMessage(),
            'notificationPreview' => $shared->notificationPreview(),
        ];
    }
}
