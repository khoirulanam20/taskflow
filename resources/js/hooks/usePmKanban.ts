import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import Sortable from 'sortablejs';
import { PmKanbanColumn } from '@/types/pm';

interface UsePmKanbanOptions {
    columnSelector: string;
    cardSelector: string;
    onStatusChange: (taskId: number, statusId: number) => void;
    enabled?: boolean;
    /** Re-init when task placement changes after Inertia visit */
    columnSignature: string;
}

function revertDrag(item: HTMLElement, from: HTMLElement, oldIndex: number): void {
    const children = from.children;
    if (oldIndex >= 0 && oldIndex < children.length) {
        from.insertBefore(item, children[oldIndex]);
        return;
    }
    from.appendChild(item);
}

export function pmKanbanSignature(columns: PmKanbanColumn[]): string {
    return columns
        .map((column) => `${column.id}:${(column.tasks ?? []).map((task) => task.id).join(',')}`)
        .join('|');
}

export function usePmKanban({
    columnSelector,
    cardSelector,
    onStatusChange,
    enabled = true,
    columnSignature,
}: UsePmKanbanOptions): void {
    const onStatusChangeRef = useRef(onStatusChange);
    onStatusChangeRef.current = onStatusChange;
    const instancesRef = useRef<Sortable[]>([]);

    useEffect(() => {
        if (!enabled || !columnSignature) return;

        let cancelled = false;

        const destroyAll = (): void => {
            instancesRef.current.forEach((instance) => {
                try {
                    instance.destroy();
                } catch {
                    // ponytail: Sortable may already be torn down if DOM moved
                }
            });
            instancesRef.current = [];
        };

        const init = (): void => {
            if (cancelled) return;
            destroyAll();

            document.querySelectorAll(columnSelector).forEach((column) => {
                instancesRef.current.push(
                    Sortable.create(column as HTMLElement, {
                        group: 'pm-kanban',
                        animation: 150,
                        draggable: cardSelector,
                        ghostClass: 'opacity-40',
                        filter: '.no-drag',
                        preventOnFilter: false,
                        onAdd: (event) => {
                            const item = event.item as HTMLElement;
                            const taskId = Number(item.dataset.taskId);
                            const statusId = Number((event.to as HTMLElement).dataset.statusId);

                            // Kembalikan DOM ke posisi React sebelum update server
                            revertDrag(item, event.from, event.oldIndex ?? -1);

                            if (taskId && statusId) {
                                onStatusChangeRef.current(taskId, statusId);
                            }
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
    }, [columnSelector, cardSelector, enabled, columnSignature]);
}
