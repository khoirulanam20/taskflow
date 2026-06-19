import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import Sortable from 'sortablejs';
import { pmTasksOnlyReload } from '@/lib/pmInertia';
import { PmStatus, PmTask } from '@/types/pm';

interface UsePmListSortableOptions {
    workspaceSlug: string;
    listId: number;
    statuses: PmStatus[];
    tasks: PmTask[];
    enabled?: boolean;
}

function revertDrag(item: HTMLElement, from: HTMLElement, oldIndex: number): void {
    const children = from.children;
    if (oldIndex >= 0 && oldIndex < children.length) {
        from.insertBefore(item, children[oldIndex]);
        return;
    }
    from.appendChild(item);
}

function collectColumn(container: HTMLElement): { status_id: number; task_ids: number[] } {
    return {
        status_id: Number(container.dataset.statusId),
        task_ids: [...container.querySelectorAll<HTMLElement>('.pm-list-task')]
            .map((row) => Number(row.dataset.taskId))
            .filter((id) => id > 0),
    };
}

function snapshotFromEvent(event: Sortable.SortableEvent): { status_id: number; task_ids: number[] }[] {
    const columns: { status_id: number; task_ids: number[] }[] = [collectColumn(event.to as HTMLElement)];
    if (event.from !== event.to) {
        columns.push(collectColumn(event.from as HTMLElement));
    }
    return columns;
}

export function pmListSignature(statuses: PmStatus[], tasks: PmTask[]): string {
    return `${statuses.map((s) => s.id).join(',')}|${tasks.map((t) => `${t.id}:${t.status_id}`).join(',')}`;
}

export function usePmListSortable({
    workspaceSlug,
    listId,
    statuses,
    tasks,
    enabled = true,
}: UsePmListSortableOptions): void {
    const instancesRef = useRef<Sortable[]>([]);
    const signature = pmListSignature(statuses, tasks);

    useEffect(() => {
        if (!enabled || !signature) return;

        let cancelled = false;

        const destroyAll = (): void => {
            instancesRef.current.forEach((instance) => {
                try {
                    instance.destroy();
                } catch {
                    // ponytail: DOM may already be gone
                }
            });
            instancesRef.current = [];
        };

        const persistOrder = (columns: { status_id: number; task_ids: number[] }[]): void => {
            router.post(
                route('pm.tasks.reorder', [workspaceSlug, listId]),
                { columns },
                pmTasksOnlyReload,
            );
        };

        const init = (): void => {
            if (cancelled) return;
            destroyAll();

            document.querySelectorAll<HTMLElement>('.pm-list-column').forEach((column) => {
                instancesRef.current.push(
                    Sortable.create(column, {
                        group: 'pm-list-tasks',
                        animation: 150,
                        draggable: '.pm-list-task',
                        handle: '.pm-list-drag-handle',
                        ghostClass: 'opacity-40',
                        filter: '.no-drag',
                        preventOnFilter: false,
                        onEnd: (event) => {
                            if (event.from === event.to && event.oldIndex === event.newIndex) return;

                            const columns = snapshotFromEvent(event);
                            revertDrag(event.item as HTMLElement, event.from, event.oldIndex ?? -1);
                            persistOrder(columns);
                        },
                    }),
                );
            });
        };

        const frame = requestAnimationFrame(init);
        const removeStart = router.on('start', () => {
            cancelAnimationFrame(frame);
            destroyAll();
        });
        const removeFinish = router.on('finish', () => {
            if (cancelled) return;
            requestAnimationFrame(init);
        });

        return () => {
            cancelled = true;
            removeStart();
            removeFinish();
            cancelAnimationFrame(frame);
            destroyAll();
        };
    }, [enabled, listId, signature, workspaceSlug]);
}
