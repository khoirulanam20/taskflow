import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import IconoirIcon from '@/Components/IconoirIcon';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContentRight } from '@/Components/ui/sheet';
import { PmTaskAttachment } from '@/types/pm';

interface TaskAttachmentViewerProps {
    attachment: PmTaskAttachment | null;
    workspaceSlug: string;
    taskId: number;
    onClose: () => void;
}

type PreviewData =
    | { type: 'link'; title: string; url: string }
    | { type: 'markdown'; title: string; content: string }
    | { type: 'document'; title: string; previewable: false };

function isPdfAttachment(file: PmTaskAttachment): boolean {
    if (file.mime_type === 'application/pdf') return true;
    return file.original_name.toLowerCase().endsWith('.pdf');
}

function isWordAttachment(file: PmTaskAttachment): boolean {
    const mime = file.mime_type ?? '';
    if (
        mime === 'application/msword' ||
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        return true;
    }
    const name = file.original_name.toLowerCase();
    return name.endsWith('.doc') || name.endsWith('.docx');
}

export default function TaskAttachmentViewer({
    attachment,
    workspaceSlug,
    taskId,
    onClose,
}: TaskAttachmentViewerProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [iframeBlocked, setIframeBlocked] = useState(false);

    const previewUrl = attachment
        ? route('pm.tasks.attachments.preview', [workspaceSlug, taskId, attachment.id])
        : '';
    const downloadUrl = attachment?.type !== 'link' && attachment
        ? route('pm.tasks.attachments.download', [workspaceSlug, taskId, attachment.id])
        : null;

    useEffect(() => {
        if (!attachment) {
            setPreview(null);
            setError(null);
            setIframeBlocked(false);
            return;
        }

        if (attachment.type === 'document' && isPdfAttachment(attachment)) {
            setPreview(null);
            setError(null);
            return;
        }

        if (attachment.type === 'document' && isWordAttachment(attachment)) {
            setPreview({
                type: 'document',
                title: attachment.original_name,
                previewable: false,
            });
            setError(null);
            return;
        }

        if (attachment.type === 'link' && attachment.url) {
            setPreview({
                type: 'link',
                title: attachment.original_name,
                url: attachment.url,
            });
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);
        setPreview(null);

        axios
            .get(previewUrl, { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (cancelled) return;
                setPreview(res.data as PreviewData);
            })
            .catch(() => {
                if (cancelled) return;
                setError('Gagal memuat preview.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [attachment, previewUrl]);

    const open = attachment !== null;
    const linkUrl =
        preview?.type === 'link'
            ? preview.url
            : attachment?.type === 'link'
              ? attachment.url
              : null;

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContentRight className="z-[60] max-w-2xl">
                {attachment && (
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div className="min-w-0 pr-4">
                                <p className="truncate text-base font-semibold text-text-primary">
                                    {attachment.original_name}
                                </p>
                                <p className="text-xs capitalize text-text-secondary">
                                    {attachment.type}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {downloadUrl && (
                                    <Button asChild size="sm" variant="secondary">
                                        <a href={downloadUrl}>Download</a>
                                    </Button>
                                )}
                                {linkUrl && (
                                    <Button asChild size="sm" variant="secondary">
                                        <a
                                            href={linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Buka tab baru
                                        </a>
                                    </Button>
                                )}
                                <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                                    Tutup
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {loading && (
                                <p className="text-sm text-text-secondary">Memuat...</p>
                            )}
                            {error && <p className="text-sm text-danger">{error}</p>}

                            {attachment.type === 'document' && isPdfAttachment(attachment) && (
                                <iframe
                                    src={previewUrl}
                                    title={attachment.original_name}
                                    className="h-[calc(100vh-8rem)] w-full rounded-md border border-border"
                                />
                            )}

                            {preview?.type === 'document' && !preview.previewable && (
                                <div className="rounded-lg border border-border bg-gray-50 p-6 text-center">
                                    <IconoirIcon
                                        name="page"
                                        className="mx-auto mb-3 text-3xl text-text-secondary"
                                    />
                                    <p className="mb-1 text-sm font-medium text-text-primary">
                                        Preview tidak tersedia
                                    </p>
                                    <p className="mb-4 text-sm text-text-secondary">
                                        File Word hanya bisa dibuka lewat download.
                                    </p>
                                    {downloadUrl && (
                                        <Button asChild size="sm">
                                            <a href={downloadUrl}>Download file</a>
                                        </Button>
                                    )}
                                </div>
                            )}

                            {preview?.type === 'link' && (
                                <div className="flex h-full flex-col gap-3">
                                    {!iframeBlocked ? (
                                        <iframe
                                            src={preview.url}
                                            title={preview.title}
                                            className="h-[calc(100vh-10rem)] w-full rounded-md border border-border"
                                            onError={() => setIframeBlocked(true)}
                                        />
                                    ) : (
                                        <div className="rounded-lg border border-border bg-gray-50 p-6 text-center">
                                            <p className="mb-4 text-sm text-text-secondary">
                                                Situs ini tidak bisa di-embed. Buka di tab baru.
                                            </p>
                                            <Button asChild size="sm">
                                                <a
                                                    href={preview.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Buka {preview.url}
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                    <p className="truncate text-xs text-text-secondary">{preview.url}</p>
                                </div>
                            )}

                            {preview?.type === 'markdown' && (
                                <article className="pm-markdown space-y-3 text-sm text-text-primary">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {preview.content}
                                    </ReactMarkdown>
                                </article>
                            )}
                        </div>
                    </div>
                )}
            </SheetContentRight>
        </Sheet>
    );
}
