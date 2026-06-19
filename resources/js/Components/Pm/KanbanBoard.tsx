import UserAvatar from '@/Components/UserAvatar';
import TaskRowMenu from '@/Components/Pm/TaskRowMenu';
import { cn } from '@/lib/utils';
import { PmKanbanColumn, PmTask } from '@/types/pm';

const priorityClass: Record<string, string> = {
    urgent: 'badge-danger',
    high: 'badge-warning',
    normal: 'badge',
    low: 'badge',
};

interface KanbanBoardProps {
    columns: PmKanbanColumn[];
    columnDataAttr: 'data-kanban-column' | 'data-sprint-column';
    showListName?: boolean;
    onTaskDetail?: (task: PmTask) => void;
}

export default function KanbanBoard({
    columns,
    columnDataAttr,
    showListName = false,
    onTaskDetail,
}: KanbanBoardProps) {
    if (columns.length === 0) {
        return (
            <div className="card flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm font-medium text-text-primary">Belum ada kolom status</p>
                <p className="text-sm text-text-secondary">Tambahkan status di list untuk memakai board.</p>
            </div>
        );
    }

    return (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {columns.map((column) => {
                const tasks = column.tasks ?? [];
                const isEmpty = tasks.length === 0;

                return (
                    <div
                        key={column.id}
                        className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-gray-50/80 sm:w-80"
                    >
                        <div
                            className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3"
                            style={{ boxShadow: `inset 0 3px 0 0 ${column.color}` }}
                        >
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: column.color }}
                            />
                            <span className="truncate text-sm font-semibold text-text-primary">{column.name}</span>
                            <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
                                {tasks.length}
                            </span>
                        </div>

                        <div
                            {...{ [columnDataAttr]: true }}
                            data-status-id={column.id}
                            className={cn(
                                'flex min-h-[140px] flex-1 flex-col gap-2 p-2',
                                isEmpty &&
                                    'm-2 rounded-lg border border-dashed border-gray-200 bg-white/60',
                            )}
                        >
                            {isEmpty ? (
                                <p className="flex flex-1 items-center justify-center py-8 text-xs text-text-secondary">
                                    Belum ada task
                                </p>
                            ) : (
                                tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        data-kanban-card
                                        data-task-id={task.id}
                                        className="relative cursor-grab rounded-lg border border-border bg-white p-3 pr-10 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                                    >
                                        {onTaskDetail && (
                                            <div className="no-drag absolute right-1 top-1">
                                                <TaskRowMenu
                                                    onDetail={() => onTaskDetail(task)}
                                                />
                                            </div>
                                        )}
                                        <p className="text-sm font-medium leading-snug text-text-primary">
                                            {task.title}
                                        </p>
                                        {showListName && task.list_name && (
                                            <p className="mt-1 text-xs text-text-secondary">{task.list_name}</p>
                                        )}
                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <span
                                                className={`badge pointer-events-none capitalize ${priorityClass[task.priority] ?? 'badge'}`}
                                            >
                                                {task.priority}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {task.due_date && (
                                                    <span className="text-xs text-text-secondary">
                                                        {task.due_date}
                                                    </span>
                                                )}
                                                {task.assignees?.length > 0 && (
                                                    <div className="flex -space-x-1">
                                                        {task.assignees.slice(0, 3).map((assignee) => (
                                                            <UserAvatar
                                                                key={assignee.id}
                                                                user={assignee}
                                                                className="h-6 w-6 border-2 border-white text-[10px]"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
