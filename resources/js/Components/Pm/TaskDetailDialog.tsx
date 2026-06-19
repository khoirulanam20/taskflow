import { FormEventHandler, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';
import UserAvatar from '@/Components/UserAvatar';
import CommentInput, { renderCommentBody } from '@/Components/Pm/CommentInput';
import PriorityDot from '@/Components/Pm/PriorityDot';
import TaskAttachmentsSection from '@/Components/Pm/TaskAttachmentsSection';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { pmTaskReload } from '@/lib/pmInertia';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Sheet, SheetContentRight } from '@/Components/ui/sheet';
import {
    PmMember,
    PmPriorityOption,
    PmSprint,
    PmStatus,
    PmTag,
    PmTask,
} from '@/types/pm';

interface TaskDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: PmTask | null;
    workspaceSlug: string;
    members: PmMember[];
    statuses: PmStatus[];
    workspaceTags?: PmTag[];
    sprints?: PmSprint[];
    priorities: PmPriorityOption[];
    onDelete?: (task: PmTask) => void;
}

function FieldRow({
    icon,
    leading,
    label,
    children,
}: {
    icon?: string;
    leading?: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[120px_1fr] items-center gap-3 border-b border-border/60 py-2.5 last:border-b-0">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
                {leading ?? (icon ? <IconoirIcon name={icon} className="shrink-0 text-base" /> : null)}
                {label}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

export default function TaskDetailDialog({
    open,
    onOpenChange,
    task,
    workspaceSlug,
    members,
    statuses,
    workspaceTags = [],
    sprints = [],
    priorities,
    onDelete,
}: TaskDetailDialogProps) {
    const [saving, setSaving] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [creatingTag, setCreatingTag] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        status_id: '',
        assignee_id: 'none',
        priority: 'normal',
        sprint_id: 'none',
        start_date: '',
        due_date: '',
        tag_ids: [] as number[],
    });

    useEffect(() => {
        if (!task) return;
        setForm({
            title: task.title,
            description: task.description ?? '',
            status_id: String(task.status_id),
            assignee_id: task.assignees[0] ? String(task.assignees[0].id) : 'none',
            priority: task.priority,
            sprint_id: task.sprint_id ? String(task.sprint_id) : 'none',
            start_date: task.start_date ?? '',
            due_date: task.due_date ?? '',
            tag_ids: (task.tags ?? []).map((t) => t.id),
        });
    }, [task]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!task || !form.title.trim()) return;

        setSaving(true);
        router.put(
            route('pm.tasks.update', [workspaceSlug, task.id]),
            {
                title: form.title.trim(),
                description: form.description || null,
                status_id: Number(form.status_id),
                priority: form.priority,
                sprint_id: form.sprint_id === 'none' ? null : Number(form.sprint_id),
                start_date: form.start_date || null,
                due_date: form.due_date || null,
                assignee_ids: form.assignee_id === 'none' ? [] : [Number(form.assignee_id)],
                tag_ids: form.tag_ids,
            },
            {
                ...pmTaskReload,
                onFinish: () => setSaving(false),
            },
        );
    };

    const postComment = (body: string) => {
        if (!task) return;

        router.post(
            route('pm.tasks.comments.store', [workspaceSlug, task.id]),
            { body },
            pmTaskReload,
        );
    };

    const toggleTag = (tagId: number) => {
        setForm((f) => ({
            ...f,
            tag_ids: f.tag_ids.includes(tagId)
                ? f.tag_ids.filter((id) => id !== tagId)
                : [...f.tag_ids, tagId],
        }));
    };

    const createTag = () => {
        const name = newTagName.trim();
        if (!name) return;

        setCreatingTag(true);
        router.post(
            route('pm.tags.store', workspaceSlug),
            { name },
            {
                ...pmTaskReload,
                onSuccess: () => setNewTagName(''),
                onFinish: () => setCreatingTag(false),
            },
        );
    };

    const currentStatus = statuses.find((s) => s.id === Number(form.status_id));
    const assignee = members.find((m) => m.id === Number(form.assignee_id));
    const comments = task?.comments ?? [];
    const attachments = task?.attachments ?? [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContentRight className="max-w-5xl">
                {task && (
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b border-border px-5 py-3">
                            <span className="text-xs text-text-secondary">
                                {task.list_name ?? 'Task'}
                            </span>
                            <div className="flex items-center gap-1">
                                {onDelete && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-danger hover:text-danger"
                                        onClick={() => onDelete(task)}
                                    >
                                        <IconoirIcon name="trash" />
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <IconoirIcon name="xmark" className="text-lg" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1">
                            <form
                                onSubmit={submit}
                                className="min-w-0 flex-1 overflow-y-auto px-6 py-5"
                            >
                                <input
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, title: e.target.value }))
                                    }
                                    className="mb-4 w-full border-0 bg-transparent text-2xl font-semibold text-text-primary outline-none placeholder:text-text-secondary"
                                    placeholder="Judul task"
                                />

                                <div className="mb-6 rounded-lg border border-border/60 bg-gray-50/50 px-4">
                                    <FieldRow icon="check-circle" label="Status">
                                        <Select
                                            value={form.status_id}
                                            onValueChange={(v) =>
                                                setForm((f) => ({ ...f, status_id: v }))
                                            }
                                        >
                                            <SelectTrigger className="h-8 w-auto border-0 bg-transparent px-0 shadow-none">
                                                {currentStatus ? (
                                                    <span
                                                        className="rounded px-2 py-0.5 text-xs font-semibold uppercase text-white"
                                                        style={{
                                                            backgroundColor: currentStatus.color,
                                                        }}
                                                    >
                                                        {currentStatus.name}
                                                    </span>
                                                ) : (
                                                    <SelectValue />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FieldRow>

                                    <FieldRow icon="user" label="Assignee">
                                        <Select
                                            value={form.assignee_id}
                                            onValueChange={(v) =>
                                                setForm((f) => ({ ...f, assignee_id: v }))
                                            }
                                        >
                                            <SelectTrigger className="h-8 w-full max-w-xs border-0 bg-transparent px-0 shadow-none">
                                                {assignee ? (
                                                    <span className="flex items-center gap-2">
                                                        <UserAvatar
                                                            user={assignee}
                                                            className="h-6 w-6"
                                                        />
                                                        {assignee.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-text-secondary">
                                                        Empty
                                                    </span>
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">—</SelectItem>
                                                {members.map((m) => (
                                                    <SelectItem key={m.id} value={String(m.id)}>
                                                        {m.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FieldRow>

                                    <FieldRow icon="calendar" label="Dates">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                                type="date"
                                                value={form.start_date}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        start_date: e.target.value,
                                                    }))
                                                }
                                                className="h-8 w-36 border-border/60"
                                            />
                                            <span className="text-text-secondary">→</span>
                                            <Input
                                                type="date"
                                                value={form.due_date}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        due_date: e.target.value,
                                                    }))
                                                }
                                                className="h-8 w-36 border-border/60"
                                            />
                                        </div>
                                    </FieldRow>

                                    <FieldRow
                                        leading={<PriorityDot priority={form.priority} className="h-3 w-3" />}
                                        label="Priority"
                                    >
                                        <Select
                                            value={form.priority}
                                            onValueChange={(v) =>
                                                setForm((f) => ({ ...f, priority: v }))
                                            }
                                        >
                                            <SelectTrigger className="h-8 w-40 border-0 bg-transparent px-0 shadow-none capitalize">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorities.map((p) => (
                                                    <SelectItem key={p.value} value={p.value}>
                                                        <span className="flex items-center gap-2 capitalize">
                                                            <PriorityDot priority={p.value} />
                                                            {p.label}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FieldRow>

                                    {sprints.length > 0 && (
                                        <FieldRow icon="flash" label="Sprint">
                                            <Select
                                                value={form.sprint_id}
                                                onValueChange={(v) =>
                                                    setForm((f) => ({ ...f, sprint_id: v }))
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-48 border-0 bg-transparent px-0 shadow-none">
                                                    <SelectValue placeholder="Empty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">—</SelectItem>
                                                    {sprints.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FieldRow>
                                    )}

                                    <FieldRow icon="label" label="Tags">
                                        <div className="space-y-2">
                                            {workspaceTags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {workspaceTags.map((tag) => {
                                                        const active = form.tag_ids.includes(tag.id);
                                                        return (
                                                            <button
                                                                key={tag.id}
                                                                type="button"
                                                                onClick={() => toggleTag(tag.id)}
                                                                className={`rounded-full px-2 py-0.5 text-xs font-medium transition-opacity ${
                                                                    active
                                                                        ? 'text-white'
                                                                        : 'bg-gray-100 text-text-secondary'
                                                                }`}
                                                                style={
                                                                    active
                                                                        ? { backgroundColor: tag.color }
                                                                        : undefined
                                                                }
                                                            >
                                                                {tag.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newTagName}
                                                    onChange={(e) => setNewTagName(e.target.value)}
                                                    placeholder="Tag baru..."
                                                    className="h-8 text-sm"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            createTag();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={creatingTag || !newTagName.trim()}
                                                    onClick={createTag}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                    </FieldRow>
                                </div>

                                <div className="mb-6">
                                    <p className="mb-2 text-sm font-medium text-text-secondary">
                                        Description
                                    </p>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                description: e.target.value,
                                            }))
                                        }
                                        rows={5}
                                        placeholder="Add description..."
                                        className="input min-h-[120px] w-full resize-y"
                                    />
                                </div>

                                <TaskAttachmentsSection
                                    workspaceSlug={workspaceSlug}
                                    taskId={task.id}
                                    attachments={attachments}
                                />

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={saving || !form.title.trim()}>
                                        {saving ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>

                            <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-gray-50/50">
                                <div className="border-b border-border px-4 py-3 text-sm font-medium text-text-primary">
                                    Activity
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                                    {comments.length === 0 && (
                                        <p className="text-sm text-text-secondary">
                                            Belum ada komentar.
                                        </p>
                                    )}
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="rounded-md bg-white p-3 shadow-sm">
                                            <div className="mb-1 flex items-center gap-2">
                                                {comment.user && (
                                                    <UserAvatar
                                                        user={comment.user}
                                                        className="h-6 w-6"
                                                    />
                                                )}
                                                <span className="text-xs font-medium text-text-primary">
                                                    {comment.user?.name ?? 'User'}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap text-sm text-text-primary">
                                                {renderCommentBody(comment.body)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <CommentInput members={members} onSubmit={postComment} />
                            </aside>
                        </div>
                    </div>
                )}
            </SheetContentRight>
        </Sheet>
    );
}
