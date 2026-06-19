import { Fragment, useState } from 'react';
import { router } from '@inertiajs/react';
import TaskListRow from '@/Components/Pm/TaskListRow';
import PriorityDot from '@/Components/Pm/PriorityDot';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { PM_LIST_ROW_GRID } from '@/lib/pmListGrid';
import { pmTaskReload } from '@/lib/pmInertia';
import { subtaskToPmTask } from '@/lib/pmTaskHelpers';
import { PmMember, PmPriorityOption, PmStatus, PmSubtask, PmTask } from '@/types/pm';

interface TaskSubtaskRowsProps {
    workspaceSlug: string;
    parentTaskId: number;
    subtasks: PmSubtask[];
    statuses: PmStatus[];
    members: PmMember[];
    priorities: PmPriorityOption[];
    selectedIds: number[];
    onToggle: (id: number, checked: boolean) => void;
    onOpenDetail: (task: PmTask) => void;
    onDelete: (task: PmTask) => void;
    onUpdate: (task: PmTask, patch: Record<string, string | number | null | number[]>) => void;
    statusColor?: string;
    parentTask?: PmTask;
    depth?: number;
    onSubtaskCreated?: () => void;
}

export default function TaskSubtaskRows({
    workspaceSlug,
    parentTaskId,
    subtasks,
    statuses,
    members,
    priorities,
    selectedIds,
    onToggle,
    onOpenDetail,
    onDelete,
    onUpdate,
    statusColor = '#6F767E',
    parentTask,
    depth = 0,
    onSubtaskCreated,
}: TaskSubtaskRowsProps) {
    const [adding, setAdding] = useState(false);
    const [expandedTaskIds, setExpandedTaskIds] = useState<Record<number, boolean>>({});
    const [draft, setDraft] = useState({
        title: '',
        assignee_id: 'none',
        due_date: '',
        priority: 'normal',
    });

    const resetDraft = () => {
        setDraft({ title: '', assignee_id: 'none', due_date: '', priority: 'normal' });
        setAdding(false);
    };

    const saveSubtask = () => {
        const title = draft.title.trim();
        if (!title) return;

        router.post(
            route('pm.tasks.subtasks.store', [workspaceSlug, parentTaskId]),
            {
                title,
                priority: draft.priority,
                due_date: draft.due_date || null,
                assignee_ids: draft.assignee_id === 'none' ? [] : [Number(draft.assignee_id)],
            },
            {
                ...pmTaskReload,
                onSuccess: () => {
                    resetDraft();
                    onSubtaskCreated?.();
                },
            },
        );
    };

    const toggleExpanded = (taskId: number) => {
        setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const addRow = adding ? (
        <div
            className={`${PM_LIST_ROW_GRID} border-b border-border/40 bg-gray-50/40 px-3 py-1.5`}
            style={depth > 0 ? { paddingLeft: `${12 + depth * 16}px` } : undefined}
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
                            saveSubtask();
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
                <Button type="button" size="sm" disabled={!draft.title.trim()} onClick={saveSubtask}>
                    Save
                </Button>
            </div>
        </div>
    ) : (
        <button
            type="button"
            className={`${PM_LIST_ROW_GRID} w-full border-b border-border/40 px-3 py-2 text-left text-sm text-text-secondary hover:bg-gray-50`}
            style={depth > 0 ? { paddingLeft: `${12 + depth * 16}px` } : undefined}
            onClick={() => setAdding(true)}
        >
            <span />
            <span />
            <span />
            <span className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-border" />
                Add subtask
            </span>
        </button>
    );

    return (
        <div className="overflow-hidden bg-gray-50/40">
            {subtasks.map((sub) => {
                const nested = sub.subtasks ?? [];
                const task = subtaskToPmTask(sub, parentTask);
                const isExpanded = expandedTaskIds[sub.id] ?? false;

                return (
                    <Fragment key={sub.id}>
                        <TaskListRow
                            task={task}
                            statusColor={sub.status?.color ?? statusColor}
                            variant="subtask"
                            members={members}
                            priorities={priorities}
                            selected={selectedIds.includes(sub.id)}
                            onToggle={(checked) => onToggle(sub.id, checked)}
                            onOpenDetail={() => onOpenDetail(task)}
                            onDelete={() => onDelete(task)}
                            onUpdate={(patch) => onUpdate(task, patch)}
                            expanded={isExpanded}
                            onToggleExpand={() => toggleExpanded(sub.id)}
                            subtaskCount={nested.length}
                            indentDepth={depth}
                        />
                        {isExpanded && (
                            <TaskSubtaskRows
                                workspaceSlug={workspaceSlug}
                                parentTaskId={sub.id}
                                parentTask={task}
                                subtasks={nested}
                                statuses={statuses}
                                members={members}
                                priorities={priorities}
                                selectedIds={selectedIds}
                                onToggle={onToggle}
                                onOpenDetail={onOpenDetail}
                                onDelete={onDelete}
                                onUpdate={onUpdate}
                                statusColor={sub.status?.color ?? statusColor}
                                depth={depth + 1}
                                onSubtaskCreated={() =>
                                    setExpandedTaskIds((prev) => ({ ...prev, [sub.id]: true }))
                                }
                            />
                        )}
                    </Fragment>
                );
            })}
            {addRow}
        </div>
    );
}
