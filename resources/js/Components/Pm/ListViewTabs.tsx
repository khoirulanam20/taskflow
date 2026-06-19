import { Link } from '@inertiajs/react';
import IconoirIcon from '@/Components/IconoirIcon';

interface ListViewTabsProps {
    workspaceSlug: string;
    listId: number;
    active: 'list' | 'board';
}

export default function ListViewTabs({ workspaceSlug, listId, active }: ListViewTabsProps) {
    const tabClass = (isActive: boolean) =>
        `flex items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-sm font-medium transition-colors ${
            isActive
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
        }`;

    return (
        <div className="flex gap-5 border-b border-border">
            <Link href={route('pm.lists.show', [workspaceSlug, listId])} className={tabClass(active === 'list')}>
                <IconoirIcon name="list" className="text-base" />
                List
            </Link>
            <Link href={route('pm.lists.board', [workspaceSlug, listId])} className={tabClass(active === 'board')}>
                <IconoirIcon name="view-grid" className="text-base" />
                Board
            </Link>
        </div>
    );
}
