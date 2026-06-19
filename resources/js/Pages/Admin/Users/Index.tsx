import { FormEventHandler, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
import { useAlert } from '@/Components/Alert/AlertContext';
import AppLayout from '@/Layouts/AppLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import TablePagination from '@/Components/TablePagination';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import UserFormFields, { UserFormData } from '@/Components/Admin/Users/UserFormFields';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { usePermission } from '@/hooks/usePermission';
import { PageProps, Paginated, Role } from '@/types';

interface UserRow {
    id: number;
    name: string;
    username: string | null;
    email: string;
    is_active: boolean;
    roles: Array<{ id: number; name: string; title: string }>;
}

interface UsersIndexProps {
    users: Paginated<UserRow>;
    roles: Role[];
    filters: { q: string };
}

type UserForm = UserFormData;

const emptyUser = (): UserForm => ({
    name: '',
    username: '',
    email: '',
    password: '',
    role: '',
    is_active: true,
});

export default function Index({ users, roles, filters }: UsersIndexProps) {
    const { auth } = usePage<PageProps>().props;
    const { confirm } = useAlert();
    const canCreate = usePermission('users.create');
    const canUpdate = usePermission('users.update');
    const canDelete = usePermission('users.delete');
    const canImpersonate = usePermission('impersonate.start');

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const [search, setSearch] = useState(filters.q);

    const createForm = useForm(emptyUser());
    const editForm = useForm(emptyUser());

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('app.users.index'), { q: search }, { preserveState: true });
    };

    const openEdit = (user: UserRow) => {
        setEditingUserId(user.id);
        editForm.setData({
            name: user.name,
            username: user.username ?? '',
            email: user.email,
            password: '',
            role: user.roles[0]?.name ?? '',
            is_active: user.is_active,
        });
        setEditOpen(true);
    };

    return (
        <AppLayout header="Pengguna">
            <Head title="Pengguna" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={submitSearch} className="flex-1" data-tour="users-search">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, email, username..."
                            className="max-w-md"
                        />
                    </form>
                    {canCreate && (
                        <Button onClick={() => setCreateOpen(true)} data-tour="users-create">
                            <IconoirIcon name="plus" className="text-base" /> Tambah
                        </Button>
                    )}
                </div>

                <div className="card overflow-hidden p-0" data-tour="users-table">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.username ?? '-'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.roles[0]?.title ?? user.roles[0]?.name ?? '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? 'success' : 'warning'}>
                                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            {canUpdate && (
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                                    <IconoirIcon name="edit" className="text-base" />
                                                </Button>
                                            )}
                                            {canImpersonate &&
                                                user.id !== auth.user?.id &&
                                                user.is_active &&
                                                !user.roles.some((role) => role.name === 'superadmin') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={async () => {
                                                            const ok = await confirm({
                                                                title: 'Impersonate User',
                                                                message: `Masuk sebagai ${user.name}?`,
                                                                type: 'warning',
                                                                confirmLabel: 'Ya',
                                                            });
                                                            if (ok) {
                                                                router.post(route('app.impersonate.start', user.id));
                                                            }
                                                        }}
                                                    >
                                                        <IconoirIcon name="log-in" className="text-base" />
                                                    </Button>
                                                )}
                                            {canDelete && user.id !== auth.user?.id && (
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(user)}>
                                                    <IconoirIcon name="trash" className="text-base text-danger" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        paginator={users}
                        routeName="app.users.index"
                        query={{ q: filters.q || undefined }}
                    />
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Pengguna</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            createForm.post(route('app.users.store'), {
                                onSuccess: () => {
                                    setCreateOpen(false);
                                    createForm.reset();
                                },
                            });
                        }}
                        className="space-y-4"
                    >
                        <UserFormFields form={createForm} roles={roles} includePassword />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={createForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Pengguna</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!editingUserId) return;
                            editForm.put(route('app.users.update', editingUserId), {
                                onSuccess: () => setEditOpen(false),
                            });
                        }}
                        className="space-y-4"
                    >
                        <UserFormFields form={editForm} roles={roles} />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={editForm.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Hapus Pengguna"
                message={`Hapus ${deleteTarget?.name}? Tindakan tidak dapat dibatalkan.`}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    router.delete(route('app.users.destroy', deleteTarget.id), {
                        onSuccess: () => setDeleteTarget(null),
                    });
                }}
            />
        </AppLayout>
    );
}
