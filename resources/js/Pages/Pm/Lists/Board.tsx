import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import KanbanBoard from '@/Components/Pm/KanbanBoard';
import ListViewTabs from '@/Components/Pm/ListViewTabs';
import TaskDetailDialog from '@/Components/Pm/TaskDetailDialog';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import IconoirIcon from '@/Components/IconoirIcon';
import { Button } from '@/Components/ui/button';
import { pmKanbanSignature, usePmKanban } from '@/hooks/usePmKanban';
import { flattenKanbanTasks, usePmDetailTask } from '@/hooks/usePmDetailTask';
import { pmTasksOnlyReload } from '@/lib/pmInertia';
import { PmLayoutShell } from '@/Layouts/PmLayout';
import {
    PmKanbanColumn,
    PmMember,
    PmPriorityOption,
    PmSpace,
    PmSprint,
    PmStatus,
    PmTask,
    PmWorkspace,
} from '@/types/pm';

interface BoardProps {
    workspace: PmWorkspace;
    workspaces: PmWorkspace[];
    spaces: PmSpace[];
    members: PmMember[];
    currentList: { id: number; name: string; space_id: number };
    currentSpace: { id: number; name: string; color: string; can_manage?: boolean };
    sprints: PmSprint[];
    statuses: PmStatus[];
    columns?: PmKanbanColumn[];
    tasks: PmTask[];
    filters: Record<string, unknown>;
    priorities: PmPriorityOption[];
}

export default function Board({
    workspace,
    workspaces,
    spaces,
    members,
    currentList,
    currentSpace,
    columns = [],
    statuses,
    sprints,
    priorities,
}: BoardProps) {
    const [deleteListOpen, setDeleteListOpen] = useState(false);
    const [deletingList, setDeletingList] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PmTask | null>(null);
    const allTasks = flattenKanbanTasks(columns);
    const { detailTask, detailTags, detailOpen, openDetail, closeDetail } = usePmDetailTask(
        allTasks,
        workspace.slug,
    );
    const canManage = currentSpace.can_manage ?? false;
    const taskCount = columns.reduce((sum, col) => sum + (col.tasks?.length ?? 0), 0);
    const columnSignature = pmKanbanSignature(columns);

    usePmKanban({
        columnSelector: '[data-kanban-column]',
        cardSelector: '[data-kanban-card]',
        columnSignature,
        onStatusChange: (taskId, statusId) => {
            router.put(
                route('pm.tasks.update', [workspace.slug, taskId]),
                { status_id: statusId },
                pmTasksOnlyReload,
            );
        },
    });

    const breadcrumb = (
        <span className="truncate">
            <span className="text-text-primary">{workspace.name}</span>
            <span className="mx-2 text-text-secondary">/</span>
            <span>{currentSpace.name}</span>
            <span className="mx-2 text-text-secondary">/</span>
            <span className="font-medium text-text-primary">{currentList.name}</span>
        </span>
    );

    return (
        <PmLayoutShell
            workspace={workspace}
            workspaces={workspaces}
            spaces={spaces}
            currentListId={currentList.id}
            breadcrumb={breadcrumb}
        >
            <Head title={`Board - ${currentList.name}`} />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <ListViewTabs workspaceSlug={workspace.slug} listId={currentList.id} active="board" />
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm text-text-secondary">
                            {taskCount} task · {columns.length} kolom
                        </p>
                        {canManage && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="text-danger hover:text-danger"
                                onClick={() => setDeleteListOpen(true)}
                            >
                                <IconoirIcon name="trash" /> Hapus List
                            </Button>
                        )}
                    </div>
                </div>

                <KanbanBoard
                    key={columnSignature}
                    columns={columns}
                    columnDataAttr="data-kanban-column"
                    onTaskDetail={openDetail}
                />
            </div>

            <TaskDetailDialog
                open={detailOpen}
                onOpenChange={(open) => !open && closeDetail()}
                task={detailTask}
                workspaceSlug={workspace.slug}
                members={members}
                statuses={statuses}
                workspaceTags={detailTags}
                sprints={sprints}
                priorities={priorities}
                onDelete={(task) => {
                    closeDetail();
                    setDeleteTarget(task);
                }}
            />

            <ConfirmDeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    router.delete(route('pm.tasks.destroy', [workspace.slug, deleteTarget.id]), {
                        preserveScroll: true,
                        onSuccess: () => {
                            setDeleteTarget(null);
                            closeDetail();
                        },
                    });
                }}
                title="Hapus task?"
                message={`Task "${deleteTarget?.title}" akan dihapus permanen.`}
            />

            <ConfirmDeleteDialog
                open={deleteListOpen}
                onOpenChange={setDeleteListOpen}
                processing={deletingList}
                onConfirm={() => {
                    setDeletingList(true);
                    router.delete(route('pm.lists.destroy', [workspace.slug, currentList.id]), {
                        onFinish: () => {
                            setDeletingList(false);
                            setDeleteListOpen(false);
                        },
                    });
                }}
                title="Hapus list?"
                message={`List "${currentList.name}" dan semua task di dalamnya akan dihapus permanen.`}
            />
        </PmLayoutShell>
    );
}
