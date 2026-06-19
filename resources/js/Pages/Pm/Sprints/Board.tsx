import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import KanbanBoard from '@/Components/Pm/KanbanBoard';
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

const sprintStatusLabel: Record<string, string> = {
    planned: 'Direncanakan',
    active: 'Aktif',
    completed: 'Selesai',
};

interface SprintBoardProps {
    workspace: PmWorkspace;
    workspaces: PmWorkspace[];
    spaces: PmSpace[];
    sprint: {
        id: number;
        name: string;
        status: string;
        space_id: number;
        start_date: string | null;
        end_date: string | null;
    };
    columns?: PmKanbanColumn[];
    summary: { total: number; done: number };
    members: PmMember[];
    sprints: PmSprint[];
    priorities: PmPriorityOption[];
}

export default function Board({
    workspace,
    workspaces,
    spaces,
    sprint,
    columns = [],
    summary,
    members,
    sprints,
    priorities,
}: SprintBoardProps) {
    const [deleteSprintOpen, setDeleteSprintOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PmTask | null>(null);
    const allTasks = flattenKanbanTasks(columns);
    const { detailTask, detailTags, detailOpen, openDetail, closeDetail } = usePmDetailTask(
        allTasks,
        workspace.slug,
    );
    const space = spaces.find((s) => s.id === sprint.space_id);
    const canManage = space?.can_manage ?? false;
    const columnSignature = pmKanbanSignature(columns);
    const statusLabel = sprintStatusLabel[sprint.status] ?? sprint.status;
    const progress = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;
    const statuses: PmStatus[] = columns.map(({ id, name, color }) => ({ id, name, color }));

    usePmKanban({
        columnSelector: '[data-sprint-column]',
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

    const closeSprint = () => {
        router.post(route('pm.sprints.close', [workspace.slug, sprint.id]), {}, { preserveScroll: true });
    };

    const deleteSprint = () => {
        setDeleting(true);
        router.delete(route('pm.sprints.destroy', [workspace.slug, sprint.id]), {
            onFinish: () => {
                setDeleting(false);
                setDeleteSprintOpen(false);
            },
        });
    };

    const breadcrumb = (
        <span className="truncate">
            <span className="text-text-primary">{workspace.name}</span>
            <span className="mx-2 text-text-secondary">/</span>
            <span>Sprint</span>
            <span className="mx-2 text-text-secondary">/</span>
            <span className="font-medium text-text-primary">{sprint.name}</span>
        </span>
    );

    return (
        <PmLayoutShell
            workspace={workspace}
            workspaces={workspaces}
            spaces={spaces}
            breadcrumb={breadcrumb}
        >
            <Head title={`Sprint ${sprint.name}`} />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="badge capitalize">{statusLabel}</span>
                        <span className="text-sm text-text-secondary">
                            {summary.done}/{summary.total} selesai ({progress}%)
                        </span>
                        {(sprint.start_date || sprint.end_date) && (
                            <span className="text-sm text-text-secondary">
                                {sprint.start_date ?? '—'} → {sprint.end_date ?? '—'}
                            </span>
                        )}
                    </div>
                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            {sprint.status !== 'completed' && (
                                <Button variant="secondary" size="sm" onClick={closeSprint}>
                                    Tutup Sprint
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                className="text-danger hover:text-danger"
                                onClick={() => setDeleteSprintOpen(true)}
                            >
                                <IconoirIcon name="trash" />
                                Hapus Sprint
                            </Button>
                        </div>
                    )}
                </div>

                <KanbanBoard
                    key={columnSignature}
                    columns={columns}
                    columnDataAttr="data-sprint-column"
                    showListName
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
                open={deleteSprintOpen}
                onOpenChange={setDeleteSprintOpen}
                onConfirm={deleteSprint}
                processing={deleting}
                title="Hapus sprint?"
                message={`Sprint "${sprint.name}" akan dihapus. Task tetap ada tanpa sprint.`}
            />
        </PmLayoutShell>
    );
}
