import { FormEventHandler, useCallback, useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
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
import { PmMember } from '@/types/pm';

interface PendingInvite {
    id: number;
    email: string;
    role: string;
    expires_at: string;
}

interface WorkspaceMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceSlug: string;
}

export default function WorkspaceMembersDialog({
    open,
    onOpenChange,
    workspaceSlug,
}: WorkspaceMembersDialogProps) {
    const [members, setMembers] = useState<PmMember[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PmMember | null>(null);
    const form = useForm({ email: '', role: 'member' });

    const reload = useCallback(() => {
        return axios
            .get(route('pm.settings.members', workspaceSlug))
            .then((res) => {
                setMembers(res.data.members ?? []);
                setPendingInvites(res.data.pendingInvites ?? []);
            });
    }, [workspaceSlug]);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        reload().finally(() => setLoading(false));
    }, [open, reload]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('pm.members.store', workspaceSlug), {
            preserveScroll: true,
            onSuccess: () => {
                setAddOpen(false);
                form.reset();
                void reload();
            },
        });
    };

    const updateRole = (member: PmMember, role: string) => {
        if (member.role === 'owner') return;
        router.put(route('pm.members.update', [workspaceSlug, member.id]), { role }, {
            preserveScroll: true,
            onSuccess: () => void reload(),
        });
    };

    const removeMember = () => {
        if (!deleteTarget) return;
        router.delete(route('pm.members.destroy', [workspaceSlug, deleteTarget.id]), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                void reload();
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Anggota Workspace</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text-secondary">
                        Tambah anggota existing atau kirim undangan email.
                    </p>

                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setAddOpen(true)}>
                            <IconoirIcon name="plus" /> Tambah
                        </Button>
                    </div>

                    {loading ? (
                        <p className="py-6 text-center text-sm text-text-secondary">Memuat...</p>
                    ) : (
                        <div className="max-h-72 overflow-y-auto rounded-md border border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="py-6 text-center text-sm text-text-secondary"
                                            >
                                                Belum ada anggota.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell className="text-text-secondary">
                                                {member.email}
                                            </TableCell>
                                            <TableCell>
                                                {member.role === 'owner' ? (
                                                    <span className="badge capitalize">{member.role}</span>
                                                ) : (
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
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {member.role !== 'owner' && (
                                                    <button
                                                        type="button"
                                                        className="text-text-secondary hover:text-danger"
                                                        onClick={() => setDeleteTarget(member)}
                                                    >
                                                        <IconoirIcon name="trash" />
                                                    </button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {!loading && pendingInvites.length > 0 && (
                        <div className="rounded-md border border-border">
                            <div className="border-b border-border px-3 py-2 text-sm font-medium">
                                Undangan menunggu
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Kadaluarsa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingInvites.map((invite) => (
                                        <TableRow key={invite.id}>
                                            <TableCell>{invite.email}</TableCell>
                                            <TableCell className="capitalize">{invite.role}</TableCell>
                                            <TableCell className="text-text-secondary">
                                                {new Date(invite.expires_at).toLocaleDateString('id-ID')}
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
                        <DialogTitle>Tambah Anggota</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                className="mt-1"
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <Label>Role</Label>
                            <Select
                                value={form.data.role}
                                onValueChange={(v) => form.setData('role', v)}
                            >
                                <SelectTrigger className="mt-1">
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
                                Tambah
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title="Keluarkan anggota?"
                message={`${deleteTarget?.name} tidak lagi bisa akses workspace ini.`}
                onConfirm={removeMember}
            />
        </>
    );
}
