import { Fragment, useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
import TaskListRow from '@/Components/Pm/TaskListRow';
import PriorityDot from '@/Components/Pm/PriorityDot';
import TaskSubtaskRows from '@/Components/Pm/TaskSubtaskRows';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { usePmListSortable } from '@/hooks/usePmListSortable';
import { PM_LIST_ROW_GRID } from '@/lib/pmListGrid';
import { pmTasksOnlyReload } from '@/lib/pmInertia';
import { PmMember, PmPriorityOption, PmStatus, PmTask } from '@/types/pm';

interface TaskListGroupedProps {
    workspaceSlug: string;
    listId: number;
    statuses: PmStatus[];
    tasks: PmTask[];
    members: PmMember[];
    priorities: PmPriorityOption[];
    selectedIds: number[];
    statusFilterId?: number | null;
    openAddForStatusId?: number | null;
    onOpenAddHandled?: () => void;
    onToggle: (id: number, checked: boolean) => void;
    onOpenDetail: (task: PmTask) => void;
    onDelete: (task: PmTask) => void;
    onUpdate: (task: PmTask, patch: Record<string, string | number | null | number[]>) => void;
}

export default function TaskListGrouped({
    workspaceSlug,
    listId,
    statuses,
    tasks,
    members,
    priorities,
    selectedIds,
    statusFilterId,
    openAddForStatusId,
    onOpenAddHandled,
    onToggle,
    onOpenDetail,
    onDelete,
    onUpdate,
}: TaskListGroupedProps) {
    const [addingStatusId, setAddingStatusId] = useState<number | null>(null);
    const [draft, setDraft] = useState({
        title: '',
        assignee_id: 'none',
        due_date: '',
        priority: 'normal',
    });
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
    const [expandedTaskIds, setExpandedTaskIds] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (openAddForStatusId == null) return;
        setAddingStatusId(openAddForStatusId);
        setCollapsed((prev) => ({ ...prev, [openAddForStatusId]: false }));
        onOpenAddHandled?.();
    }, [openAddForStatusId, onOpenAddHandled]);

    const visibleStatuses = useMemo(() => {
        if (statusFilterId) {
            return statuses.filter((s) => s.id === statusFilterId);
        }
        return statuses;
    }, [statuses, statusFilterId]);

    usePmListSortable({ workspaceSlug, listId, statuses: visibleStatuses, tasks });

    const tasksByStatus = useMemo(() => {
        const map = new Map<number, PmTask[]>();
        visibleStatuses.forEach((s) => map.set(s.id, []));
        tasks.forEach((t) => {
            const list = map.get(t.status_id);
            if (list) list.push(t);
        });
        return map;
    }, [visibleStatuses, tasks]);

    const resetDraft = () => {
        setDraft({ title: '', assignee_id: 'none', due_date: '', priority: 'normal' });
        setAddingStatusId(null);
    };

    const saveTask = (statusId: number) => {
        const title = draft.title.trim();
        if (!title) return;

        router.post(
            route('pm.tasks.store', [workspaceSlug, listId]),
            {
                title,
                status_id: statusId,
                priority: draft.priority,
                due_date: draft.due_date || null,
                assignee_ids: draft.assignee_id === 'none' ? [] : [Number(draft.assignee_id)],
            },
            {
                ...pmTasksOnlyReload,
                onSuccess: () => {
                    resetDraft();
                    setCollapsed((prev) => ({ ...prev, [statusId]: false }));
                },
            },
        );
    };

    const renderAddRow = (statusId: number) =>
        addingStatusId === statusId ? (
            <div
                className={`${PM_LIST_ROW_GRID} border-b border-border/40 bg-gray-50/40 px-3 py-1.5`}
            >
                <span />
                <span />
                <span />
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-border" />
                    <Input
                        autoFocus
                        value={draft.title}
                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                saveTask(statusId);
                            }
                            if (e.key === 'Escape') resetDraft();
                        }}
                        placeholder="Task Name"
                        className="h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                </div>
                <Select
                    value={draft.assignee_id}
                    onValueChange={(v) => setDraft((d) => ({ ...d, assignee_id: v }))}
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent px-1 shadow-none">
                        <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {members.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={draft.due_date}
                    onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
                    className="h-8 border-0 bg-transparent px-1 text-xs shadow-none"
                />
                <Select
                    value={draft.priority}
                    onValueChange={(v) => setDraft((d) => ({ ...d, priority: v }))}
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent px-1 shadow-none capitalize">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {priorities.map((p) => (
                            <SelectItem key={p.value} value={p.value} className="capitalize">
                                <span className="flex items-center gap-2">
                                    <PriorityDot priority={p.value} />
                                    {p.label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-1">
                    <Button type="button" variant="secondary" size="sm" onClick={resetDraft}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={!draft.title.trim()}
                        onClick={() => saveTask(statusId)}
                    >
                        Save
                    </Button>
                </div>
            </div>
        ) : (
            <button
                type="button"
                className={`${PM_LIST_ROW_GRID} w-full border-b border-border/40 px-3 py-2 text-left text-sm text-text-secondary hover:bg-gray-50`}
                onClick={() => setAddingStatusId(statusId)}
            >
                <span />
                <span />
                <span />
                <span className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-border" />
                    Add task
                </span>
            </button>
        );

    const toggleStatusCollapsed = (statusId: number) => {
        setCollapsed((prev) => ({ ...prev, [statusId]: !prev[statusId] }));
    };

    const toggleTaskExpanded = (taskId: number) => {
        setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    if (visibleStatuses.length === 0) {
        return (
            <div className="py-16 text-center text-sm text-text-secondary">
                Belum ada status di list ini.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {visibleStatuses.map((status) => {
                const groupTasks = tasksByStatus.get(status.id) ?? [];
                const isCollapsed = collapsed[status.id] ?? false;

                return (
                    <section key={status.id} className="overflow-hidden rounded-lg border border-border bg-white">
                        <button
                            type="button"
                            onClick={() => toggleStatusCollapsed(status.id)}
                            className="flex w-full items-center gap-2 border-b border-border bg-gray-50/80 px-3 py-2 text-left hover:bg-gray-100/80"
                        >
                            <IconoirIcon
                                name="nav-arrow-down"
                                className={`text-sm text-text-secondary transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                            />
                            <span
                                className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
                                style={{ backgroundColor: status.color }}
                            >
                                {status.name}
                            </span>
                            <span className="text-xs text-text-secondary">{groupTasks.length}</span>
                        </button>

                        {!isCollapsed && (
                            <>
                                <div
                                    className={`${PM_LIST_ROW_GRID} border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-secondary`}
                                >
                                    <span />
                                    <span />
                                    <span />
                                    <span>Name</span>
                                    <span>Assignee</span>
                                    <span>Due date</span>
                                    <span>Priority</span>
                                    <span />
                                </div>

                                <div className="pm-list-column min-h-[8px]" data-status-id={status.id}>
                                    {groupTasks.map((task) => {
                                        const subtasks = task.subtasks ?? [];
                                        const isExpanded = expandedTaskIds[task.id] ?? false;

                                        return (
                                            <Fragment key={task.id}>
                                                <TaskListRow
                                                    task={task}
                                                    statusColor={status.color}
                                                    variant="parent"
                                                    members={members}
                                                    priorities={priorities}
                                                    selected={selectedIds.includes(task.id)}
                                                    onToggle={(checked) => onToggle(task.id, checked)}
                                                    onOpenDetail={() => onOpenDetail(task)}
                                                    onDelete={() => onDelete(task)}
                                                    onUpdate={(patch) => onUpdate(task, patch)}
                                                    expanded={isExpanded}
                                                    onToggleExpand={() => toggleTaskExpanded(task.id)}
                                                    subtaskCount={subtasks.length}
                                                    taskIdAttr={task.id}
                                                />

                                                {isExpanded && (
                                                    <TaskSubtaskRows
                                                        workspaceSlug={workspaceSlug}
                                                        parentTaskId={task.id}
                                                        parentTask={task}
                                                        subtasks={subtasks}
                                                        statuses={statuses}
                                                        members={members}
                                                        priorities={priorities}
                                                        selectedIds={selectedIds}
                                                        onToggle={onToggle}
                                                        onOpenDetail={onOpenDetail}
                                                        onDelete={onDelete}
                                                        onUpdate={onUpdate}
                                                        statusColor={status.color}
                                                        onSubtaskCreated={() =>
                                                            setExpandedTaskIds((prev) => ({
                                                                ...prev,
                                                                [task.id]: true,
                                                            }))
                                                        }
                                                    />
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                    {renderAddRow(status.id)}
                                </div>
                            </>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
