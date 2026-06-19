import { router } from '@inertiajs/react';

/** Normalisasi URL notifikasi (absolut/relatif) lalu navigasi Inertia. */
export function visitNotificationUrl(rawUrl: string): void {
    try {
        const target = new URL(rawUrl, window.location.origin);

        if (target.origin !== window.location.origin) {
            window.location.assign(rawUrl);
            return;
        }

        const path = `${target.pathname}${target.search}${target.hash}`;
        router.visit(path);
    } catch {
        router.visit(rawUrl);
    }
}

/** Baca ?task= dari URL, buka detail, lalu bersihkan query. */
export function consumeTaskDeepLink(openDetailById: (taskId: number) => void): void {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('task');
    if (!taskId) return;

    const id = Number(taskId);
    if (id <= 0) return;

    openDetailById(id);

    const url = new URL(window.location.href);
    url.searchParams.delete('task');
    window.history.replaceState({}, '', url.pathname + url.search);
}
