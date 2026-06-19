import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PmNavItemMenu from '@/Components/Pm/PmNavItemMenu';
import IconoirIcon from '@/Components/IconoirIcon';
import { usePmSidebarSortable } from '@/hooks/usePmSidebarSortable';
import { PmSpace, PmSprint, PmTaskListNav, PmWorkspace } from '@/types/pm';

const SIDEBAR_COLLAPSED_KEY = 'pm-sidebar-collapsed';

function spaceCollapseKey(workspaceId: number): string {
    return `pm-spaces-collapsed-${workspaceId}`;
}

function readSpaceCollapsed(workspaceId: number): Record<number, boolean> {
    try {
        return JSON.parse(localStorage.getItem(spaceCollapseKey(workspaceId)) ?? '{}') as Record<
            number,
            boolean
        >;
    } catch {
        return {};
    }
}

interface PmSidebarProps {
    workspace: PmWorkspace;
    workspaces: PmWorkspace[];
    spaces: PmSpace[];
    currentListId?: number;
    collapsed: boolean;
    canCreateWorkspace: boolean;
    onCreateSpace?: () => void;
    onCreateList?: (spaceId: number) => void;
    onEditSpace?: (space: PmSpace) => void;
    onAssignSpace?: (space: PmSpace) => void;
    onDeleteSpace?: (space: PmSpace) => void;
    onEditList?: (list: PmTaskListNav) => void;
    onDeleteList?: (list: PmTaskListNav) => void;
    onEditSprint?: (sprint: PmSprint) => void;
    onDeleteSprint?: (sprint: PmSprint) => void;
}

export default function PmSidebar({
    workspace,
    workspaces,
    spaces,
    currentListId,
    collapsed,
    canCreateWorkspace,
    onCreateSpace,
    onCreateList,
    onEditSpace,
    onAssignSpace,
    onDeleteSpace,
    onEditList,
    onDeleteList,
    onEditSprint,
    onDeleteSprint,
}: PmSidebarProps) {
    const [spaceCollapsed, setSpaceCollapsed] = useState<Record<number, boolean>>(() =>
        readSpaceCollapsed(workspace.id),
    );

    usePmSidebarSortable({
        workspaceSlug: workspace.slug,
        spaces,
        canReorderSpaces: canCreateWorkspace,
        enabled: !collapsed,
    });

    useEffect(() => {
        localStorage.setItem(spaceCollapseKey(workspace.id), JSON.stringify(spaceCollapsed));
    }, [spaceCollapsed, workspace.id]);

    const toggleSpace = (spaceId: number) => {
        setSpaceCollapsed((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }));
    };

    const firstListHref = (space: PmSpace): string | null => {
        const list = space.task_lists?.[0];
        if (!list) return null;
        return route('pm.lists.show', [workspace.slug, list.id]);
    };

    if (collapsed) {
        return (
            <div className="flex h-full flex-col items-center py-3">
                <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-1 pt-1">
                    {spaces.map((space) => {
                        const href = firstListHref(space);
                        const content = (
                            <span
                                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
                                title={space.name}
                                style={{ boxShadow: `inset 0 0 0 2px ${space.color}` }}
                            >
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: space.color }}
                                />
                            </span>
                        );

                        return href ? (
                            <Link key={space.id} href={href}>
                                {content}
                            </Link>
                        ) : (
                            <span key={space.id}>{content}</span>
                        );
                    })}
                </div>

                <Link
                    href={route('app.dashboard')}
                    className="btn-icon-secondary mt-3 h-8 w-8 p-0"
                    title="Kembali"
                >
                    <IconoirIcon name="arrow-left" className="text-base" />
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-border p-4">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Workspace
                </label>
                <select
                    className="input w-full"
                    value={workspace.slug}
                    onChange={(e) => {
                        window.location.href = route('pm.workspaces.show', e.target.value);
                    }}
                >
                    {workspaces.map((ws) => (
                        <option key={ws.id} value={ws.slug}>
                            {ws.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Spaces</span>
                {canCreateWorkspace && onCreateSpace && (
                    <button type="button" onClick={onCreateSpace} className="btn-icon-secondary h-7 w-7 p-0">
                        <IconoirIcon name="plus" className="text-sm" />
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-2 pb-4">
                {spaces.length === 0 && (
                    <p className="px-2 text-sm text-text-secondary">Belum ada space.</p>
                )}
                <div className="pm-spaces-column space-y-1">
                    {spaces.map((space) => {
                        const isSpaceCollapsed = spaceCollapsed[space.id] ?? false;

                        return (
                            <div
                                key={space.id}
                                data-id={space.id}
                                className="pm-space-block mb-2 rounded-md"
                            >
                                <div className="group flex items-center gap-0.5 px-1 py-1">
                                    {canCreateWorkspace && (
                                        <button
                                            type="button"
                                            className="pm-nav-drag-handle flex h-6 w-5 shrink-0 cursor-grab items-center justify-center text-text-secondary opacity-0 hover:text-text-primary group-hover:opacity-100 active:cursor-grabbing"
                                            aria-label="Geser space"
                                        >
                                            <IconoirIcon name="drag-hand-gesture" className="text-xs" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => toggleSpace(space.id)}
                                        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 hover:bg-gray-100"
                                    >
                                        <IconoirIcon
                                            name="nav-arrow-down"
                                            className={`shrink-0 text-xs text-text-secondary transition-transform ${isSpaceCollapsed ? '-rotate-90' : ''}`}
                                        />
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: space.color }}
                                        />
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                                            {space.name}
                                        </span>
                                    </button>
                                    {space.can_manage && (
                                        <PmNavItemMenu
                                            onEdit={onEditSpace ? () => onEditSpace(space) : undefined}
                                            onAssign={onAssignSpace ? () => onAssignSpace(space) : undefined}
                                            onDelete={onDeleteSpace ? () => onDeleteSpace(space) : undefined}
                                        />
                                    )}
                                    {onCreateList && space.can_manage && (
                                        <button
                                            type="button"
                                            onClick={() => onCreateList(space.id)}
                                            className="btn-icon-secondary h-7 w-7 shrink-0 p-0 text-text-secondary"
                                            title="Tambah List"
                                        >
                                            <IconoirIcon name="plus" className="text-sm" />
                                        </button>
                                    )}
                                </div>

                                {!isSpaceCollapsed && (
                                    <div className="space-y-0.5 pb-1 pl-5">
                                        {(space.sprints?.length ?? 0) > 0 && (
                                            <div
                                                className="pm-sprints-column space-y-0.5"
                                                data-space-id={space.id}
                                            >
                                                {space.sprints?.map((sprint) => (
                                                    <div
                                                        key={sprint.id}
                                                        data-id={sprint.id}
                                                        className="pm-sprint-nav group flex items-center gap-0.5"
                                                    >
                                                        {space.can_manage && (
                                                            <button
                                                                type="button"
                                                                className="pm-nav-drag-handle flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-text-secondary opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                                                                aria-label="Geser sprint"
                                                            >
                                                                <IconoirIcon
                                                                    name="drag-hand-gesture"
                                                                    className="text-[10px]"
                                                                />
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={route('pm.sprints.board', [
                                                                workspace.slug,
                                                                sprint.id,
                                                            ])}
                                                            className="flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-md px-2 py-1.5 text-xs text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                                                        >
                                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                                                                Sprint
                                                            </span>
                                                            {sprint.name}
                                                        </Link>
                                                        {space.can_manage && (
                                                            <PmNavItemMenu
                                                                onEdit={
                                                                    onEditSprint
                                                                        ? () => onEditSprint(sprint)
                                                                        : undefined
                                                                }
                                                                onDelete={
                                                                    onDeleteSprint
                                                                        ? () => onDeleteSprint(sprint)
                                                                        : undefined
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div
                                            className="pm-lists-column space-y-0.5"
                                            data-space-id={space.id}
                                        >
                                            {(space.task_lists ?? []).map((list) => {
                                                const active = list.id === currentListId;

                                                return (
                                                    <div
                                                        key={list.id}
                                                        data-id={list.id}
                                                        className={`pm-list-nav group flex min-w-0 items-center gap-0.5 rounded-md ${
                                                            active ? 'bg-gray-100' : ''
                                                        }`}
                                                    >
                                                        {space.can_manage && (
                                                            <button
                                                                type="button"
                                                                className="pm-nav-drag-handle flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-text-secondary opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                                                                aria-label="Geser list"
                                                            >
                                                                <IconoirIcon
                                                                    name="drag-hand-gesture"
                                                                    className="text-[10px]"
                                                                />
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={route('pm.lists.show', [
                                                                workspace.slug,
                                                                list.id,
                                                            ])}
                                                            className={`min-w-0 flex-1 truncate px-2 py-2 text-sm transition-colors ${
                                                                active
                                                                    ? 'font-medium text-text-primary'
                                                                    : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                                                            }`}
                                                        >
                                                            {list.name}
                                                        </Link>
                                                        {space.can_manage && (
                                                            <PmNavItemMenu
                                                                active={active}
                                                                onEdit={
                                                                    onEditList
                                                                        ? () => onEditList(list)
                                                                        : undefined
                                                                }
                                                                onDelete={
                                                                    onDeleteList
                                                                        ? () => onDeleteList(list)
                                                                        : undefined
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {(space.task_lists ?? []).length === 0 && (
                                            <p className="px-2 py-1 text-xs text-text-secondary">
                                                Belum ada list
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>

            <div className="border-t border-border p-4">
                <Link
                    href={route('app.dashboard')}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
                >
                    <IconoirIcon name="arrow-left" className="text-base" />
                    Kembali
                </Link>
            </div>
        </div>
    );
}

export function readSidebarCollapsed(): boolean {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
}

export function writeSidebarCollapsed(collapsed: boolean): void {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}
