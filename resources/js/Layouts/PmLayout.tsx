import { router, useForm } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';
import PmSidebar, { readSidebarCollapsed, writeSidebarCollapsed } from '@/Components/Pm/PmSidebar';
import PmTopBar from '@/Components/Pm/PmTopBar';
import SpaceMembersDialog from '@/Components/Pm/SpaceMembersDialog';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import IconoirIcon from '@/Components/IconoirIcon';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Sheet, SheetContent } from '@/Components/ui/sheet';
import { PmSpace, PmSprint, PmTaskListNav, PmWorkspace } from '@/types/pm';

type DeleteNavTarget =
    | { kind: 'space'; item: PmSpace }
    | { kind: 'list'; item: PmTaskListNav }
    | { kind: 'sprint'; item: PmSprint };

interface PmLayoutProps {
    workspace: PmWorkspace;
    workspaces: PmWorkspace[];
    spaces: PmSpace[];
    currentListId?: number;
    breadcrumb?: ReactNode;
    onCreateSpace?: () => void;
    onCreateList?: (spaceId: number) => void;
    children: ReactNode;
}

export function PmLayoutShell({
    workspace,
    workspaces,
    spaces,
    currentListId,
    breadcrumb,
    onCreateSpace,
    onCreateList,
    children,
}: PmLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
    const [deleteTarget, setDeleteTarget] = useState<DeleteNavTarget | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editSpace, setEditSpace] = useState<PmSpace | null>(null);
    const [editList, setEditList] = useState<PmTaskListNav | null>(null);
    const [editSprint, setEditSprint] = useState<PmSprint | null>(null);
    const [assignSpace, setAssignSpace] = useState<PmSpace | null>(null);

    const spaceForm = useForm({ name: '', color: '#4B5694' });
    const listForm = useForm({ name: '' });
    const sprintForm = useForm({ name: '', start_date: '', end_date: '' });

    const canCreateWorkspace = workspace.role === 'owner' || workspace.role === 'admin';

    useEffect(() => {
        writeSidebarCollapsed(sidebarCollapsed);
    }, [sidebarCollapsed]);

    const toggleSidebarCollapsed = () => setSidebarCollapsed((prev) => !prev);

    const openEditSpace = (space: PmSpace) => {
        spaceForm.setData({ name: space.name, color: space.color });
        setEditSpace(space);
    };

    const openEditList = (list: PmTaskListNav) => {
        listForm.setData({ name: list.name });
        setEditList(list);
    };

    const openEditSprint = (sprint: PmSprint) => {
        sprintForm.setData({
            name: sprint.name,
            start_date: sprint.start_date ?? '',
            end_date: sprint.end_date ?? '',
        });
        setEditSprint(sprint);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);

        let url: string;
        if (deleteTarget.kind === 'space') {
            url = route('pm.spaces.destroy', [workspace.slug, deleteTarget.item.id]);
        } else if (deleteTarget.kind === 'list') {
            url = route('pm.lists.destroy', [workspace.slug, deleteTarget.item.id]);
        } else {
            url = route('pm.sprints.destroy', [workspace.slug, deleteTarget.item.id]);
        }

        router.delete(url, {
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const deleteTitle =
        deleteTarget?.kind === 'space'
            ? 'Hapus space?'
            : deleteTarget?.kind === 'list'
              ? 'Hapus list?'
              : 'Hapus sprint?';

    const deleteMessage =
        deleteTarget?.kind === 'space'
            ? `Space "${deleteTarget.item.name}" dan semua list/task di dalamnya akan dihapus permanen.`
            : deleteTarget?.kind === 'list'
              ? `List "${deleteTarget.item.name}" dan semua task di dalamnya akan dihapus permanen.`
              : `Sprint "${deleteTarget?.item.name}" akan dihapus. Task tetap ada tanpa sprint.`;

    const sidebarProps = {
        workspace,
        workspaces,
        spaces,
        currentListId,
        collapsed: sidebarCollapsed,
        canCreateWorkspace,
        onCreateSpace,
        onCreateList,
        onEditSpace: openEditSpace,
        onAssignSpace: setAssignSpace,
        onDeleteSpace: (space: PmSpace) => setDeleteTarget({ kind: 'space', item: space }),
        onEditList: openEditList,
        onDeleteList: (list: PmTaskListNav) => setDeleteTarget({ kind: 'list', item: list }),
        onEditSprint: openEditSprint,
        onDeleteSprint: (sprint: PmSprint) => setDeleteTarget({ kind: 'sprint', item: sprint }),
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f6f7fb]">
            <aside
                className={`hidden shrink-0 flex-col border-r border-border bg-white transition-[width] duration-200 md:flex ${
                    sidebarCollapsed ? 'w-14' : 'w-64'
                }`}
            >
                <PmSidebar {...sidebarProps} />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <PmTopBar
                    breadcrumb={breadcrumb}
                    workspaceSlug={workspace.slug}
                    canManageMembers={canCreateWorkspace}
                    prefix={
                        <>
                            <button
                                type="button"
                                className="btn-icon-secondary md:hidden"
                                onClick={() => setMobileOpen(true)}
                            >
                                <IconoirIcon name="menu" />
                            </button>
                            <button
                                type="button"
                                className="btn-icon-secondary hidden md:inline-flex"
                                onClick={toggleSidebarCollapsed}
                                title={sidebarCollapsed ? 'Buka sidebar' : 'Kecilkan sidebar'}
                            >
                                <IconoirIcon
                                    name={sidebarCollapsed ? 'sidebar-expand' : 'sidebar-collapse'}
                                />
                            </button>
                        </>
                    }
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</main>
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent className="w-72 p-0">
                    <PmSidebar {...sidebarProps} collapsed={false} />
                </SheetContent>
            </Sheet>

            <ConfirmDeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                processing={deleting}
                title={deleteTitle}
                message={deleteMessage}
            />

            <SpaceMembersDialog
                open={assignSpace !== null}
                onOpenChange={(open) => !open && setAssignSpace(null)}
                workspaceSlug={workspace.slug}
                space={assignSpace}
            />

            <Dialog open={editSpace !== null} onOpenChange={(open) => !open && setEditSpace(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Space</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!editSpace) return;
                            spaceForm.put(route('pm.spaces.update', [workspace.slug, editSpace.id]), {
                                onSuccess: () => setEditSpace(null),
                            });
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="edit-space-name">Nama</Label>
                            <Input
                                id="edit-space-name"
                                value={spaceForm.data.name}
                                onChange={(e) => spaceForm.setData('name', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-space-color">Warna</Label>
                            <Input
                                id="edit-space-color"
                                type="color"
                                value={spaceForm.data.color}
                                onChange={(e) => spaceForm.setData('color', e.target.value)}
                                className="h-10 w-full"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setEditSpace(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={spaceForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editList !== null} onOpenChange={(open) => !open && setEditList(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit List</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!editList) return;
                            listForm.put(route('pm.lists.update', [workspace.slug, editList.id]), {
                                onSuccess: () => setEditList(null),
                            });
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="edit-list-name">Nama</Label>
                            <Input
                                id="edit-list-name"
                                value={listForm.data.name}
                                onChange={(e) => listForm.setData('name', e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setEditList(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={listForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editSprint !== null} onOpenChange={(open) => !open && setEditSprint(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Sprint</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!editSprint) return;
                            sprintForm.put(route('pm.sprints.update', [workspace.slug, editSprint.id]), {
                                onSuccess: () => setEditSprint(null),
                            });
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="edit-sprint-name">Nama</Label>
                            <Input
                                id="edit-sprint-name"
                                value={sprintForm.data.name}
                                onChange={(e) => sprintForm.setData('name', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-sprint-start">Mulai</Label>
                                <Input
                                    id="edit-sprint-start"
                                    type="date"
                                    value={sprintForm.data.start_date}
                                    onChange={(e) => sprintForm.setData('start_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-sprint-end">Selesai</Label>
                                <Input
                                    id="edit-sprint-end"
                                    type="date"
                                    value={sprintForm.data.end_date}
                                    onChange={(e) => sprintForm.setData('end_date', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setEditSprint(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={sprintForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
