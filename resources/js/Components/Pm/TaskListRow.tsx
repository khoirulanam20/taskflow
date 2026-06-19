import IconoirIcon from '@/Components/IconoirIcon';
import PriorityDot from '@/Components/Pm/PriorityDot';
import TaskRowMenu from '@/Components/Pm/TaskRowMenu';
import UserAvatar from '@/Components/UserAvatar';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { PM_LIST_ROW_GRID } from '@/lib/pmListGrid';
import { PmMember, PmPriorityOption, PmTask } from '@/types/pm';

interface TaskListRowProps {
    task: PmTask;
    statusColor: string;
    variant: 'parent' | 'subtask';
    members: PmMember[];
    priorities: PmPriorityOption[];
    selected: boolean;
    onToggle: (checked: boolean) => void;
    onOpenDetail: () => void;
    onDelete: () => void;
    onUpdate: (patch: Record<string, string | number | null | number[]>) => void;
    expanded?: boolean;
    onToggleExpand?: () => void;
    subtaskCount?: number;
    taskIdAttr?: number;
    className?: string;
    indentDepth?: number;
}

export default function TaskListRow({
    task,
    statusColor,
    variant,
    members,
    priorities,
    selected,
    onToggle,
    onOpenDetail,
    onDelete,
    onUpdate,
    expanded,
    onToggleExpand,
    subtaskCount = 0,
    taskIdAttr,
    className = '',
    indentDepth = 0,
}: TaskListRowProps) {
    const assignee = task.assignees[0] ?? null;
    const isDone = task.status?.name?.toLowerCase() === 'done';
    const isParent = variant === 'parent';
    const canExpand = onToggleExpand !== undefined;

    return (
        <div
            data-task-id={isParent ? taskIdAttr ?? task.id : undefined}
            className={`${isParent ? 'pm-list-task' : ''} group ${PM_LIST_ROW_GRID} border-b border-border/60 px-3 py-1.5 hover:bg-gray-50/80 ${className}`}
            style={indentDepth > 0 ? { paddingLeft: `${12 + indentDepth * 16}px` } : undefined}
        >
            <div className="no-drag flex justify-center">
                <Checkbox checked={selected} onCheckedChange={(v) => onToggle(v === true)} />
            </div>

            {isParent ? (
                <button
                    type="button"
                    className="pm-list-drag-handle flex cursor-grab items-center justify-center text-text-secondary opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                    aria-label="Geser task"
                >
                    <IconoirIcon name="drag-hand-gesture" className="text-sm" />
                </button>
            ) : (
                <span />
            )}

            {canExpand ? (
                <button
                    type="button"
                    className="no-drag flex items-center justify-center text-text-secondary"
                    onClick={onToggleExpand}
                    aria-label="Toggle subtasks"
                >
                    <IconoirIcon
                        name="nav-arrow-down"
                        className={`text-sm transition-transform ${expanded ? '' : '-rotate-90'} ${subtaskCount === 0 ? 'opacity-40' : ''}`}
                    />
                </button>
            ) : (
                <span />
            )}

            <button
                type="button"
                onClick={onOpenDetail}
                className={`no-drag flex min-w-0 items-center gap-2 text-left ${!isParent ? 'pl-1' : ''}`}
            >
                <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        isDone ? 'border-green-500 bg-green-500 text-white' : ''
                    }`}
                    style={
                        isDone
                            ? undefined
                            : {
                                  borderColor: statusColor,
                                  backgroundColor: `${statusColor}22`,
                              }
                    }
                >
                    {isDone && <IconoirIcon name="check" className="text-[10px]" />}
                </span>
                <span className="truncate text-sm text-text-primary hover:text-accent">{task.title}</span>
                {canExpand && subtaskCount > 0 && (
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-text-secondary">
                        {subtaskCount}
                    </span>
                )}
            </button>

            <div className="no-drag">
                <Select
                    value={assignee ? String(assignee.id) : 'none'}
                    onValueChange={(v) =>
                        onUpdate({ assignee_ids: v === 'none' ? [] : [Number(v)] })
                    }
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent px-1 shadow-none hover:bg-white">
                        {assignee ? (
                            <UserAvatar user={assignee} className="h-6 w-6" />
                        ) : (
                            <SelectValue placeholder="—" />
                        )}
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
            </div>

            <div className="no-drag">
                <input
                    type="date"
                    defaultValue={task.due_date ?? ''}
                    className="h-8 w-full rounded border-0 bg-transparent px-1 text-xs text-text-secondary hover:bg-white focus:border-border focus:ring-1 focus:ring-accent/30"
                    onChange={(e) => onUpdate({ due_date: e.target.value || null })}
                />
            </div>

            <div className="no-drag">
                <Select
                    value={task.priority}
                    onValueChange={(v) => onUpdate({ priority: v })}
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent px-1 shadow-none hover:bg-white">
                        <span className="flex items-center gap-1.5">
                            <PriorityDot priority={task.priority} />
                            <span className="text-xs capitalize text-text-secondary">{task.priority}</span>
                        </span>
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
            </div>

            <div className="no-drag opacity-0 group-hover:opacity-100">
                <TaskRowMenu onDetail={onOpenDetail} onDelete={onDelete} />
            </div>
        </div>
    );
}
