<?php

namespace App\Providers;

use App\Models\Space;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\Workspace;
use App\Policies\Pm\SpacePolicy;
use App\Policies\Pm\SprintPolicy;
use App\Policies\Pm\TaskListPolicy;
use App\Policies\Pm\TaskPolicy;
use App\Policies\Pm\WorkspacePolicy;
use App\Support\Modules\ModuleConventions;
use App\Support\Settings\IntegrationConfigService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        ModuleConventions::assertConfigIsValid();

        app(IntegrationConfigService::class)->apply();

        Gate::policy(Workspace::class, WorkspacePolicy::class);
        Gate::policy(Space::class, SpacePolicy::class);
        Gate::policy(Sprint::class, SprintPolicy::class);
        Gate::policy(TaskList::class, TaskListPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
    }
}
