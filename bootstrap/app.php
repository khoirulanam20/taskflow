<?php

use App\Http\Middleware\EnforceImpersonationTimeout;
use App\Http\Middleware\EnsureAllPermissions;
use App\Http\Middleware\EnsureAnyPermission;
use App\Http\Middleware\EnsureModulePermission;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureTwoFactorVerified;
use App\Http\Middleware\EnsureWorkspaceMember;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ImpersonationBannerData;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/internal.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::middleware('web')->group(base_path('routes/pm.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecurityHeaders::class,
        ]);

        $middleware->alias([
            'permission.check' => EnsurePermission::class,
            'permission.all' => EnsureAllPermissions::class,
            'permission.any' => EnsureAnyPermission::class,
            'permission.module' => EnsureModulePermission::class,
            'role' => RoleMiddleware::class,
            'workspace.member' => EnsureWorkspaceMember::class,
        ]);
        $middleware->web(append: [
            ImpersonationBannerData::class,
            EnforceImpersonationTimeout::class,
            EnsureTwoFactorVerified::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('activitylog:clean')->daily();
        $schedule->command('backup:database')->dailyAt('02:00');
        $schedule->command('pm:notify-due-tasks')->dailyAt('08:00');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
