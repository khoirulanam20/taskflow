import { useCallback, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { NotificationPreview, PageProps } from '@/types';

const POLL_MS = 5_000;

const emptyPreview: NotificationPreview = { unread_count: 0, recent: [] };

let pollRefs = 0;
let stopPoll: (() => void) | null = null;

function ensureNotificationPoll(): () => void {
    pollRefs += 1;

    if (pollRefs === 1) {
        stopPoll = router.poll(
            POLL_MS,
            { only: ['notificationPreview'] },
            { keepAlive: false },
        ).stop;
    }

    return () => {
        pollRefs -= 1;
        if (pollRefs <= 0 && stopPoll) {
            stopPoll();
            stopPoll = null;
            pollRefs = 0;
        }
    };
}

export function useNotificationPreview() {
    const preview = usePage<PageProps>().props.notificationPreview ?? emptyPreview;

    useEffect(() => ensureNotificationPoll(), []);

    const reloadPreview = useCallback(() => {
        router.reload({ only: ['notificationPreview'] });
    }, []);

    const markRead = useCallback(
        async (notificationId: string) => {
            try {
                await axios.post(
                    route('notifications.read', notificationId),
                    {},
                    { headers: { Accept: 'application/json' } },
                );
            } catch {
                // reload di bawah tetap jalan
            }
            reloadPreview();
        },
        [reloadPreview],
    );

    const remove = useCallback(
        async (notificationId: string) => {
            try {
                await axios.delete(route('notifications.destroy', notificationId), {
                    headers: { Accept: 'application/json' },
                });
            } catch {
                // reload di bawah tetap jalan
            }
            reloadPreview();
        },
        [reloadPreview],
    );

    return { preview, reloadPreview, markRead, remove };
}
