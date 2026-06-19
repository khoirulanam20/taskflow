import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
import TaskAttachmentViewer from '@/Components/Pm/TaskAttachmentViewer';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { pmTaskReload } from '@/lib/pmInertia';
import { PmTaskAttachment } from '@/types/pm';

interface TaskAttachmentsSectionProps {
    workspaceSlug: string;
    taskId: number;
    attachments: PmTaskAttachment[];
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentIcon(type: PmTaskAttachment['type']): string {
    if (type === 'link') return 'link';
    if (type === 'markdown') return 'code';
    return 'page';
}

export default function TaskAttachmentsSection({
    workspaceSlug,
    taskId,
    attachments,
}: TaskAttachmentsSectionProps) {
    const docRef = useRef<HTMLInputElement>(null);
    const mdFileRef = useRef<HTMLInputElement>(null);
    const [viewing, setViewing] = useState<PmTaskAttachment | null>(null);
    const [linkOpen, setLinkOpen] = useState(false);
    const [mdOpen, setMdOpen] = useState(false);
    const [mdMode, setMdMode] = useState<'upload' | 'paste'>('paste');
    const [linkForm, setLinkForm] = useState({ title: '', url: '' });
    const [mdForm, setMdForm] = useState({ title: '', content: '' });
    const [submitting, setSubmitting] = useState(false);

    const storeUrl = route('pm.tasks.attachments.store', [workspaceSlug, taskId]);

    const postAttachment = (
        data: FormData | Record<string, string | undefined>,
        formData = false,
    ) => {
        setSubmitting(true);
        router.post(storeUrl, data, {
            ...pmTaskReload,
            forceFormData: formData,
            onFinish: () => setSubmitting(false),
        });
    };

    const saveLink = () => {
        const url = linkForm.url.trim();
        if (!url) return;
        postAttachment({
            type: 'link',
            url,
            title: linkForm.title.trim() || undefined,
        });
        setLinkForm({ title: '', url: '' });
        setLinkOpen(false);
    };

    const saveMdPaste = () => {
        const title = mdForm.title.trim();
        const content = mdForm.content.trim();
        if (!title || !content) return;
        postAttachment({
            type: 'markdown',
            mode: 'paste',
            title,
            content,
        });
        setMdForm({ title: '', content: '' });
        setMdOpen(false);
    };

    return (
        <>
            <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-text-secondary">Attachments</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="secondary" size="sm">
                                Tambah
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLinkOpen(true)}>
                                <IconoirIcon name="link" className="text-base" />
                                Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => docRef.current?.click()}>
                                <IconoirIcon name="page" className="text-base" />
                                Docs / PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMdOpen(true)}>
                                <IconoirIcon name="code" className="text-base" />
                                Markdown
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <input
                        ref={docRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const data = new FormData();
                            data.append('type', 'document');
                            data.append('file', file);
                            postAttachment(data, true);
                            if (docRef.current) docRef.current.value = '';
                        }}
                    />
                    <input
                        ref={mdFileRef}
                        type="file"
                        accept=".md,.txt,text/markdown"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const data = new FormData();
                            data.append('type', 'markdown');
                            data.append('mode', 'upload');
                            data.append('file', file);
                            postAttachment(data, true);
                            if (mdFileRef.current) mdFileRef.current.value = '';
                            setMdOpen(false);
                        }}
                    />
                </div>

                {attachments.length === 0 ? (
                    <p className="text-sm text-text-secondary">Belum ada lampiran.</p>
                ) : (
                    <ul className="space-y-2">
                        {attachments.map((file) => (
                            <li
                                key={file.id}
                                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                            >
                                <button
                                    type="button"
                                    className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-accent"
                                    onClick={() => setViewing(file)}
                                >
                                    <IconoirIcon
                                        name={attachmentIcon(file.type)}
                                        className="shrink-0 text-base text-text-secondary"
                                    />
                                    <span className="truncate">{file.original_name}</span>
                                </button>
                                <div className="flex shrink-0 items-center gap-2">
                                    {file.type !== 'link' && file.size > 0 && (
                                        <span className="text-xs text-text-secondary">
                                            {formatBytes(file.size)}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        className="text-text-secondary hover:text-danger"
                                        onClick={() =>
                                            router.delete(
                                                route('pm.tasks.attachments.destroy', [
                                                    workspaceSlug,
                                                    taskId,
                                                    file.id,
                                                ]),
                                                pmTaskReload,
                                            )
                                        }
                                    >
                                        <IconoirIcon name="trash" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder="Judul (opsional)"
                            value={linkForm.title}
                            onChange={(e) =>
                                setLinkForm((f) => ({ ...f, title: e.target.value }))
                            }
                        />
                        <Input
                            placeholder="https://..."
                            value={linkForm.url}
                            onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setLinkOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                disabled={submitting || !linkForm.url.trim()}
                                onClick={saveLink}
                            >
                                Simpan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={mdOpen} onOpenChange={setMdOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah markdown</DialogTitle>
                    </DialogHeader>
                    <div className="mb-3 flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={mdMode === 'paste' ? 'default' : 'secondary'}
                            onClick={() => setMdMode('paste')}
                        >
                            Paste
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={mdMode === 'upload' ? 'default' : 'secondary'}
                            onClick={() => setMdMode('upload')}
                        >
                            Upload .md
                        </Button>
                    </div>
                    {mdMode === 'paste' ? (
                        <div className="space-y-3">
                            <Input
                                placeholder="Judul"
                                value={mdForm.title}
                                onChange={(e) =>
                                    setMdForm((f) => ({ ...f, title: e.target.value }))
                                }
                            />
                            <textarea
                                rows={8}
                                placeholder="Tulis markdown..."
                                value={mdForm.content}
                                onChange={(e) =>
                                    setMdForm((f) => ({ ...f, content: e.target.value }))
                                }
                                className="input min-h-[160px] w-full resize-y"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setMdOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        submitting ||
                                        !mdForm.title.trim() ||
                                        !mdForm.content.trim()
                                    }
                                    onClick={saveMdPaste}
                                >
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary">
                                Pilih file `.md` atau `.txt` dari komputer.
                            </p>
                            <Button
                                type="button"
                                disabled={submitting}
                                onClick={() => mdFileRef.current?.click()}
                            >
                                Pilih file
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <TaskAttachmentViewer
                attachment={viewing}
                workspaceSlug={workspaceSlug}
                taskId={taskId}
                onClose={() => setViewing(null)}
            />
        </>
    );
}
