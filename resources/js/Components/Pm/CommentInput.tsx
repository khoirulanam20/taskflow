import { FormEventHandler, useMemo, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import UserAvatar from '@/Components/UserAvatar';
import { PmMember } from '@/types/pm';

interface CommentInputProps {
    members: PmMember[];
    onSubmit: (body: string) => void;
}

function mentionableMembers(members: PmMember[]): PmMember[] {
    return members.filter((m) => m.username);
}

export function renderCommentBody(body: string) {
    const parts = body.split(/(@[\w.\-]+)/g);

    return parts.map((part, index) =>
        part.startsWith('@') ? (
            <span key={index} className="font-medium text-accent">
                {part}
            </span>
        ) : (
            <span key={index}>{part}</span>
        ),
    );
}

export default function CommentInput({ members, onSubmit }: CommentInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [body, setBody] = useState('');
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);

    const candidates = useMemo(() => {
        if (mentionQuery === null) return [];
        const q = mentionQuery.toLowerCase();
        return mentionableMembers(members)
            .filter((m) => m.username!.toLowerCase().includes(q))
            .slice(0, 6);
    }, [members, mentionQuery]);

    const syncMentionQuery = (value: string, cursor: number) => {
        const before = value.slice(0, cursor);
        const match = before.match(/@([\w.\-]*)$/);
        setMentionQuery(match ? match[1] : null);
    };

    const insertMention = (username: string) => {
        const el = textareaRef.current;
        if (!el) return;

        const cursor = el.selectionStart ?? body.length;
        const before = body.slice(0, cursor);
        const after = body.slice(cursor);
        const at = before.lastIndexOf('@');
        if (at < 0) return;

        const next = `${before.slice(0, at)}@${username} ${after}`;
        setBody(next);
        setMentionQuery(null);

        requestAnimationFrame(() => {
            const pos = at + username.length + 2;
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const trimmed = body.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
        setBody('');
        setMentionQuery(null);
    };

    return (
        <form onSubmit={submit} className="border-t border-border p-3">
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => {
                        setBody(e.target.value);
                        syncMentionQuery(e.target.value, e.target.selectionStart ?? 0);
                    }}
                    onKeyUp={(e) =>
                        syncMentionQuery(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)
                    }
                    onClick={(e) =>
                        syncMentionQuery(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)
                    }
                    rows={3}
                    placeholder="Tulis komentar... (@username untuk mention)"
                    className="input mb-2 w-full resize-none text-sm"
                />
                {candidates.length > 0 && (
                    <ul className="absolute bottom-full left-0 z-10 mb-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-md">
                        {candidates.map((member) => (
                            <li key={member.id}>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    onClick={() => insertMention(member.username!)}
                                >
                                    <UserAvatar user={member} className="h-6 w-6" />
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-text-secondary">@{member.username}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <Button type="submit" size="sm" disabled={!body.trim()} className="w-full">
                Kirim
            </Button>
        </form>
    );
}
