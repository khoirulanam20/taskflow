import { FormEventHandler, useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { PmMember, PmSpace } from '@/types/pm';

interface SpaceMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceSlug: string;
    space: PmSpace | null;
}

export default function SpaceMembersDialog({
    open,
    onOpenChange,
    workspaceSlug,
    space,
}: SpaceMembersDialogProps) {
    const [members, setMembers] = useState<PmMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PmMember | null>(null);
    const form = useForm({ email: '', role: 'member' });

    useEffect(() => {
        if (!open || !space) return;

        setLoading(true);
        window.axios
            .get(route('pm.spaces.members.index', [workspaceSlug, space.id]))
            .then((res) => setMembers(res.data.members ?? []))
            .finally(() => setLoading(false));
    }, [open, space, workspaceSlug]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!space) return;

        form.post(route('pm.spaces.members.store', [workspaceSlug, space.id]), {
            preserveScroll: true,
            onSuccess: () => {
                setAddOpen(false);
                form.reset();
                window.axios
                    .get(route('pm.spaces.members.index', [workspaceSlug, space.id]))
                    .then((res) => setMembers(res.data.members ?? []));
            },
        });
    };

    const updateRole = (member: PmMember, role: string) => {
        if (!space) return;
        router.put(route('pm.spaces.members.update', [workspaceSlug, space.id, member.id]), { role }, {
            preserveScroll: true,
            onSuccess: () => {
                window.axios
                    .get(route('pm.spaces.members.index', [workspaceSlug, space.id]))
                    .then((res) => setMembers(res.data.members ?? []));
            },
        });
    };

    const removeMember = () => {
        if (!space || !deleteTarget) return;
        router.delete(route('pm.spaces.members.destroy', [workspaceSlug, space.id, deleteTarget.id]), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                window.axios
                    .get(route('pm.spaces.members.index', [workspaceSlug, space.id]))
                    .then((res) => setMembers(res.data.members ?? []));
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Anggota Space — {space?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setAddOpen(true)}>
                            <IconoirIcon name="plus" /> Tambah
                        </Button>
                    </div>

                    {loading ? (
                        <p className="py-6 text-center text-sm text-text-secondary">Memuat...</p>
                    ) : (
                        <div className="max-h-80 overflow-y-auto rounded-md border border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-text-secondary">
                                                Belum ada anggota space.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="font-medium">{member.name}</div>
                                                <div className="text-xs text-text-secondary">{member.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(v) => updateRole(member, v)}
                                                >
                                                    <SelectTrigger className="h-8 w-28">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="member">Member</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    className="text-text-secondary hover:text-danger"
                                                    onClick={() => setDeleteTarget(member)}
                                                >
                                                    <IconoirIcon name="trash" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Anggota Space</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="space-member-email">Email</Label>
                            <Input
                                id="space-member-email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                placeholder="user@example.com"
                            />
                            {form.errors.email && (
                                <p className="mt-1 text-sm text-danger">{form.errors.email}</p>
                            )}
                        </div>
                        <div>
                            <Label>Role</Label>
                            <Select value={form.data.role} onValueChange={(v) => form.setData('role', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
                onConfirm={removeMember}
                title="Hapus anggota space?"
                message={`${deleteTarget?.name} tidak lagi bisa mengakses space ini.`}
            />
        </>
    );
}
