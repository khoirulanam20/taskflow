import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PmLayoutShell } from '@/Layouts/PmLayout';
import { PmMember, PmSpace, PmWorkspace } from '@/types/pm';

interface WorkspacesShowProps {
    workspace: PmWorkspace;
    workspaces: PmWorkspace[];
    spaces: PmSpace[];
    members: PmMember[];
}

export default function Show({ workspace, workspaces, spaces, members }: WorkspacesShowProps) {
    const [spaceOpen, setSpaceOpen] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const [listSpaceId, setListSpaceId] = useState<number | null>(null);

    const spaceForm = useForm({ name: '', color: '#4B5694' });
    const listForm = useForm({ name: '' });

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

    return (
        <PmLayoutShell
            workspace={workspace}
            workspaces={workspaces}
            spaces={spaces}
            onCreateSpace={() => setSpaceOpen(true)}
            onCreateList={(spaceId) => {
                setListSpaceId(spaceId);
                setListOpen(true);
            }}
            breadcrumb={<span>{workspace.name}</span>}
        >
            <Head title={workspace.name} />

            <div className="card mx-auto max-w-2xl text-center">
                <IconoirIcon name="folder" className="mx-auto text-4xl text-text-secondary" />
                <h2 className="mt-4 text-xl font-semibold">Mulai dari Space & List</h2>
                <p className="mt-2 text-sm text-text-secondary">
                    Buat space untuk area kerja, lalu tambahkan list untuk mengelola task.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button onClick={() => setSpaceOpen(true)}>
                        <IconoirIcon name="plus" /> Space Baru
                    </Button>
                </div>
                {members.length > 0 && (
                    <p className="mt-6 text-xs text-text-secondary">{members.length} anggota workspace</p>
                )}
            </div>

            <Dialog open={spaceOpen} onOpenChange={setSpaceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Space Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitSpace} className="space-y-4">
                        <div>
                            <Label htmlFor="space-name">Nama</Label>
                            <Input
                                id="space-name"
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
                            <Label htmlFor="list-name">Nama</Label>
                            <Input
                                id="list-name"
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
        </PmLayoutShell>
    );
}
