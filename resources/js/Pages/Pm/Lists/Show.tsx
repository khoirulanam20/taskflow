import { FormEventHandler, useCallback, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
import ListViewTabs from '@/Components/Pm/ListViewTabs';
import AddTaskSplitButton from '@/Components/Pm/AddTaskSplitButton';
import TaskDetailDialog from '@/Components/Pm/TaskDetailDialog';
import TaskListGrouped from '@/Components/Pm/TaskListGrouped';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { PmLayoutShell } from '@/Layouts/PmLayout';
import { usePmDetailTask } from '@/hooks/usePmDetailTask';
import { useTaskDeepLink } from '@/hooks/useTaskDeepLink';
import { pmTasksOnlyReload } from '@/lib/pmInertia';
import { findPmTask } from '@/lib/pmTaskHelpers';
import {
    PmMember,
    PmPriorityOption,
    PmSpace,
    PmSprint,
    PmStatus,
    PmTask,
    PmWorkspace,
} from '@/types/pm';

interface ListsShowProps {
    workspace: PmWorkspace;
    workspaces: PmWorkspace[];
    spaces: PmSpace[];
    members: PmMember[];
    currentList: { id: number; name: string; space_id: number };
    currentSpace: { id: number; name: string; color: string; can_manage?: boolean };
    statuses: PmStatus[];
    sprints: PmSprint[];
    tasks: PmTask[];
    filters: {
        q: string;
        status_id: number | string | null;
        priority: string | null;
        assignee_id: number | string | null;
    };
    priorities: PmPriorityOption[];
}

function StatCard({ label, value, tint }: { label: string; value: number; tint: string }) {
    return (
        <div className={`rounded-lg border border-border px-4 py-3 ${tint}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
        </div>
    );
}

export default function Show({
    workspace,
    workspaces,
    spaces,
    members,
    currentList,
    currentSpace,
    statuses,
    sprints,
    tasks,
    filters,
    priorities,
}: ListsShowProps) {
    const [spaceOpen, setSpaceOpen] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const [listSpaceId, setListSpaceId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PmTask | null>(null);
    const { detailTask, detailTags, detailOpen, openDetail, closeDetail } = usePmDetailTask(
        tasks,
        workspace.slug,
    );
    const [search, setSearch] = useState(filters.q ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkStatusId, setBulkStatusId] = useState<string>('');
    const [sprintOpen, setSprintOpen] = useState(false);
    const [deleteListOpen, setDeleteListOpen] = useState(false);
    const [deletingList, setDeletingList] = useState(false);
    const [openAddForStatusId, setOpenAddForStatusId] = useState<number | null>(null);

    const findTaskById = useCallback(
        (id: number) => findPmTask(tasks, id) ?? ({ id } as PmTask),
        [tasks],
    );

    const openDetailById = useCallback(
        (id: number) => openDetail(findTaskById(id)),
        [openDetail, findTaskById],
    );

    useTaskDeepLink(openDetailById);

    const spaceForm = useForm({ name: '', color: '#4B5694' });
    const listForm = useForm({ name: '' });
    const sprintForm = useForm({ name: '', start_date: '', end_date: '', status: 'planned' });

    const canManage = currentSpace.can_manage ?? false;
    const assignedCount = tasks.filter((t) => t.assignees.length > 0).length;
    const backlogCount = tasks.filter((t) => t.status?.name?.toLowerCase() !== 'done').length;

    const toggleOne = (id: number, checked: boolean) => {
        setSelectedIds((prev) =>
            checked ? [...prev, id] : prev.filter((item) => item !== id),
        );
    };

    const applyBulkStatus = () => {
        if (!bulkStatusId || selectedIds.length === 0) return;
        router.post(
            route('pm.tasks.bulk-status', [workspace.slug, currentList.id]),
            { task_ids: selectedIds, status_id: Number(bulkStatusId) },
            {
                ...pmTasksOnlyReload,
                onSuccess: () => {
                    setSelectedIds([]);
                    setBulkStatusId('');
                },
            },
        );
    };

    const submitSprint = (e: React.FormEvent) => {
        e.preventDefault();
        sprintForm.post(route('pm.sprints.store', [workspace.slug, currentSpace.id]), {
            onSuccess: () => {
                setSprintOpen(false);
                sprintForm.reset();
            },
        });
    };

    const applyFilters = (patch: Record<string, string | number | null | undefined>) => {
        router.get(
            route('pm.lists.show', [workspace.slug, currentList.id]),
            {
                q: search || undefined,
                status_id: filters.status_id || undefined,
                priority: filters.priority || undefined,
                assignee_id: filters.assignee_id || undefined,
                ...patch,
            },
            { preserveState: true, replace: true },
        );
    };

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ q: search || undefined });
    };

    const submitSpace = (e: React.FormEvent) => {
        e.preventDefault();
        spaceForm.post(route('pm.spaces.store', workspace.slug), {
            onSuccess: () => {
                setSpaceOpen(false);
                spaceForm.reset();
            },
        });
    };

    const submitList = (e: React.FormEvent) => {
        e.preventDefault();
        if (listSpaceId === null) return;
        listForm.post(route('pm.lists.store', [workspace.slug, listSpaceId]), {
            onSuccess: () => {
                setListOpen(false);
                listForm.reset();
            },
        });
    };

    const addTaskMenuItems = statuses.map((s) => ({
        label: `Tambah ke ${s.name}`,
        onSelect: () => setOpenAddForStatusId(s.id),
    }));

    const updateTask = (
        task: PmTask,
        patch: Record<string, string | number | null | number[]>,
    ) => {
        router.put(route('pm.tasks.update', [workspace.slug, task.id]), patch, pmTasksOnlyReload);
    };

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
            onCreateSpace={() => setSpaceOpen(true)}
            onCreateList={(spaceId) => {
                setListSpaceId(spaceId);
                setListOpen(true);
            }}
        >
            <Head title={`${currentList.name} - ${workspace.name}`} />

            <div className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <ListViewTabs workspaceSlug={workspace.slug} listId={currentList.id} active="list" />
                    </div>
                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setSprintOpen(true)}>
                                <IconoirIcon name="calendar" /> Sprint Baru
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="text-danger hover:text-danger"
                                onClick={() => setDeleteListOpen(true)}
                            >
                                <IconoirIcon name="trash" /> Hapus List
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard label="Backlog" value={backlogCount} tint="bg-emerald-50/60" />
                    <StatCard label="Assigned" value={assignedCount} tint="bg-amber-50/60" />
                    <StatCard label="Total" value={tasks.length} tint="bg-sky-50/60" />
                </div>

                {selectedIds.length > 0 && (
                    <div className="card flex flex-wrap items-center gap-3 py-3">
                        <span className="text-sm text-text-secondary">{selectedIds.length} dipilih</span>
                        <Select value={bulkStatusId} onValueChange={setBulkStatusId}>
                            <SelectTrigger className="h-8 w-40">
                                <SelectValue placeholder="Ubah status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button size="sm" onClick={applyBulkStatus} disabled={!bulkStatusId}>
                            Terapkan
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setSelectedIds([])}>
                            Batal
                        </Button>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3">
                    <form
                        onSubmit={submitSearch}
                        className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
                    >
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari task..."
                            className="h-8 w-44 shrink-0"
                        />
                        <Select
                            value={filters.status_id ? String(filters.status_id) : 'all'}
                            onValueChange={(v) =>
                                applyFilters({ status_id: v === 'all' ? undefined : Number(v) })
                            }
                        >
                            <SelectTrigger className="h-8 w-auto min-w-[9rem] shrink-0 whitespace-nowrap">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua status</SelectItem>
                                {statuses.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.priority ?? 'all'}
                            onValueChange={(v) =>
                                applyFilters({ priority: v === 'all' ? undefined : v })
                            }
                        >
                            <SelectTrigger className="h-8 w-auto min-w-[6.5rem] shrink-0 whitespace-nowrap">
                                <SelectValue placeholder="Prioritas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                {priorities.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </form>
                    <div className="shrink-0">
                        <AddTaskSplitButton
                            onAdd={() => {
                                const target = filters.status_id
                                    ? Number(filters.status_id)
                                    : statuses[0]?.id;
                                if (target) setOpenAddForStatusId(target);
                            }}
                            menuItems={addTaskMenuItems}
                        />
                    </div>
                </div>

                <TaskListGrouped
                    workspaceSlug={workspace.slug}
                    listId={currentList.id}
                    statuses={statuses}
                    statusFilterId={filters.status_id ? Number(filters.status_id) : null}
                    openAddForStatusId={openAddForStatusId}
                    onOpenAddHandled={() => setOpenAddForStatusId(null)}
                    tasks={tasks}
                    members={members}
                    priorities={priorities}
                    selectedIds={selectedIds}
                    onToggle={toggleOne}
                    onOpenDetail={openDetail}
                    onDelete={setDeleteTarget}
                    onUpdate={updateTask}
                />
            </div>

            <Dialog open={spaceOpen} onOpenChange={setSpaceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Space Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitSpace} className="space-y-4">
                        <div>
                            <Label>Nama</Label>
                            <Input
                                value={spaceForm.data.name}
                                onChange={(e) => spaceForm.setData('name', e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setSpaceOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={spaceForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={listOpen} onOpenChange={setListOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>List Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitList} className="space-y-4">
                        <div>
                            <Label>Nama</Label>
                            <Input
                                value={listForm.data.name}
                                onChange={(e) => listForm.setData('name', e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setListOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={listForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={sprintOpen} onOpenChange={setSprintOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sprint Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitSprint} className="space-y-4">
                        <div>
                            <Label>Nama</Label>
                            <Input
                                value={sprintForm.data.name}
                                onChange={(e) => sprintForm.setData('name', e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Mulai</Label>
                                <Input
                                    type="date"
                                    value={sprintForm.data.start_date}
                                    onChange={(e) => sprintForm.setData('start_date', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Selesai</Label>
                                <Input
                                    type="date"
                                    value={sprintForm.data.end_date}
                                    onChange={(e) => sprintForm.setData('end_date', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setSprintOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={sprintForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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
