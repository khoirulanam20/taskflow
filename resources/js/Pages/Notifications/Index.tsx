import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import PaginationLinks from '@/Components/PaginationLinks';
import IconoirIcon from '@/Components/IconoirIcon';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { visitNotificationUrl } from '@/lib/notificationNav';
import { NotificationItem, Paginated } from '@/types';

interface NotificationsIndexProps {
    notifications: Paginated<NotificationItem>;
}

export default function Index({ notifications }: NotificationsIndexProps) {
    const openNotification = (notification: NotificationItem) => {
        const url = notification.data.url;
        if (!url) return;

        if (!notification.read_at) {
            void axios.post(route('notifications.read', notification.id), {}, {
                headers: { Accept: 'application/json' },
            });
        }

        visitNotificationUrl(url);
    };

    const deleteNotification = async (notificationId: string) => {
        await axios.delete(route('notifications.destroy', notificationId), {
            headers: { Accept: 'application/json' },
        });
        router.reload({ only: ['notifications'] });
    };

    return (
        <AppLayout header="Notifications">
            <Head title="Notifications" />

            <div className="space-y-4" data-tour="notifications-list">
                {notifications.data.length === 0 && (
                    <p className="text-sm text-text-secondary">Belum ada notifikasi.</p>
                )}
                {notifications.data.map((notification) => (
                    <Card key={notification.id}>
                        <CardContent className="flex items-start justify-between gap-4 pt-6">
                            <button
                                type="button"
                                className={`min-w-0 flex-1 text-left ${
                                    notification.data.url ? 'cursor-pointer hover:opacity-90' : ''
                                }`}
                                onClick={() => openNotification(notification)}
                                disabled={!notification.data.url}
                            >
                                <div className="flex items-start gap-2">
                                    {!notification.read_at && (
                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    )}
                                    <div>
                                        <p
                                            className={`font-medium ${
                                                !notification.read_at ? 'text-text-primary' : ''
                                            }`}
                                        >
                                            {notification.data.title ?? 'Notification'}
                                        </p>
                                        <p className="text-sm text-text-secondary">
                                            {notification.data.message ?? notification.data.body}
                                        </p>
                                        <p className="mt-1 text-xs text-text-secondary">
                                            {new Date(notification.created_at).toLocaleString(
                                                'id-ID',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <div
                                data-tour={
                                    notification.id === notifications.data[0]?.id
                                        ? 'notifications-actions'
                                        : undefined
                                }
                            >
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="text-danger hover:text-danger"
                                    onClick={() => void deleteNotification(notification.id)}
                                >
                                    <IconoirIcon name="trash" className="text-sm" />
                                    Hapus
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <PaginationLinks paginator={notifications} routeName="notifications.index" />
            </div>
        </AppLayout>
    );
}
