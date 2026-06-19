import { ReactNode, useState } from 'react';
import IconoirIcon from '@/Components/IconoirIcon';
import NotificationBell from '@/Components/NotificationBell';
import WorkspaceMembersDialog from '@/Components/Pm/WorkspaceMembersDialog';

interface PmTopBarProps {
    breadcrumb?: ReactNode;
    prefix?: ReactNode;
    workspaceSlug: string;
    canManageMembers: boolean;
}

export default function PmTopBar({
    breadcrumb,
    prefix,
    workspaceSlug,
    canManageMembers,
}: PmTopBarProps) {
    const [membersOpen, setMembersOpen] = useState(false);

    return (
        <>
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 sm:px-6">
                {prefix}
                <div className="min-w-0 flex-1 truncate text-sm text-text-secondary sm:text-base">
                    {breadcrumb}
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    {canManageMembers && (
                        <button
                            type="button"
                            onClick={() => setMembersOpen(true)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                            title="Anggota Workspace"
                        >
                            <IconoirIcon name="group" className="text-lg" />
                        </button>
                    )}
                    <NotificationBell
                        iconClassName="text-xl"
                        buttonClassName="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100"
                    />
                </div>
            </header>

            {canManageMembers && (
                <WorkspaceMembersDialog
                    open={membersOpen}
                    onOpenChange={setMembersOpen}
                    workspaceSlug={workspaceSlug}
                />
            )}
        </>
    );
}
