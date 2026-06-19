import { Link } from '@inertiajs/react';
import { useState } from 'react';
import IconoirIcon from '@/Components/IconoirIcon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { useNotificationPreview } from '@/hooks/useNotificationPreview';
import { useAnyPermission } from '@/hooks/usePermission';
import { visitNotificationUrl } from '@/lib/notificationNav';
import { NotificationPreviewItem } from '@/types';

interface NotificationBellProps {
    iconClassName?: string;
    buttonClassName?: string;
}

function formatWhen(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationBell({
    iconClassName = 'text-2xl',
    buttonClassName = 'relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100',
}: NotificationBellProps) {
    const canViewAll = useAnyPermission(['notifications.list']);
    const { preview, reloadPreview, markRead, remove } = useNotificationPreview();
    const [menuOpen, setMenuOpen] = useState(false);

    const unreadCount = preview.unread_count ?? 0;
    const recent = preview.recent ?? [];

    const openNotification = (item: NotificationPreviewItem) => {
        setMenuOpen(false);

        if (!item.read_at) {
            void markRead(item.id);
        }

        if (item.url) {
            visitNotificationUrl(item.url);
        }
    };

    return (
        <DropdownMenu
            open={menuOpen}
            onOpenChange={(open) => {
                setMenuOpen(open);
                if (open) {
                    reloadPreview();
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <button type="button" className={buttonClassName} aria-label="Notifikasi">
                    <IconoirIcon name="bell" className={iconClassName} />
                    {unreadCount > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-4 py-2">
                    <h3 className="text-sm font-bold text-text-primary">Notifikasi</h3>
                </div>
                {recent.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-text-secondary">
                        Belum ada notifikasi.
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {recent.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-stretch border-b border-border/60 last:border-b-0"
                            >
                                <button
                                    type="button"
                                    className={`min-w-0 flex-1 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                                        !item.read_at ? 'bg-primary/5' : ''
                                    }`}
                                    onClick={() => openNotification(item)}
                                >
                                    <div className="flex items-start gap-2">
                                        {!item.read_at && (
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <span
                                                className={`text-sm text-text-primary ${
                                                    !item.read_at ? 'font-semibold' : 'font-medium'
                                                }`}
                                            >
                                                {item.title}
                                            </span>
                                            {item.message && (
                                                <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                                                    {item.message}
                                                </p>
                                            )}
                                            <span className="mt-1 block text-[10px] text-text-secondary">
                                                {formatWhen(item.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className="shrink-0 px-2 text-text-secondary opacity-60 hover:text-danger hover:opacity-100"
                                    aria-label="Hapus notifikasi"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        void remove(item.id);
                                    }}
                                >
                                    <IconoirIcon name="xmark" className="text-base" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {canViewAll && (
                    <>
                        <DropdownMenuSeparator className="m-0" />
                        <div className="px-4 py-2 text-center">
                            <Link
                                href={route('notifications.index')}
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                Lihat semua
                            </Link>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
