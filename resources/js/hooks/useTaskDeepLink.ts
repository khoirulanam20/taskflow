import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { consumeTaskDeepLink } from '@/lib/notificationNav';

export function useTaskDeepLink(openDetailById: (taskId: number) => void): void {
    useEffect(() => {
        const run = () => consumeTaskDeepLink(openDetailById);

        run();

        return router.on('finish', () => {
            requestAnimationFrame(run);
        });
    }, [openDetailById]);
}
