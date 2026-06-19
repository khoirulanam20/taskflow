import { FormEventHandler, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PmWorkspace } from '@/types/pm';

interface WorkspacesIndexProps {
    workspaces: PmWorkspace[];
}

export default function Index({ workspaces }: WorkspacesIndexProps) {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('pm.workspaces.store'), {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    return (
        <div className="min-h-screen bg-background p-6 sm:p-10">
            <Head title="TaskFlow" />

            <div className="mx-auto max-w-3xl space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="page-title text-2xl sm:text-3xl">TaskFlow</h1>
                        <p className="mt-1 text-sm text-text-secondary">Pilih workspace atau buat yang baru.</p>
                    </div>
                    <Button onClick={() => setOpen(true)}>
                        <IconoirIcon name="plus" className="text-base" /> Workspace Baru
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {workspaces.map((workspace) => (
                        <a
                            key={workspace.id}
                            href={route('pm.workspaces.show', workspace.slug)}
                            className="card transition-colors hover:border-primary/30"
                        >
                            <h2 className="font-semibold text-text-primary">{workspace.name}</h2>
                            <p className="mt-1 text-xs text-text-secondary">/{workspace.slug}</p>
                            <span className="badge mt-3 capitalize">{workspace.role}</span>
                        </a>
                    ))}
                    {workspaces.length === 0 && (
                        <div className="card sm:col-span-2">
                            <p className="text-sm text-text-secondary">
                                Belum ada workspace. Buat workspace pertama untuk mulai.
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    <a
                        href={route('app.dashboard')}
                        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
                    >
                        <IconoirIcon name="arrow-left" /> Kembali
                    </a>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Workspace Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="mt-1"
                                placeholder="Tim Product"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Buat
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
