import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import Sortable, { type SortableEvent } from 'sortablejs';
import { PmSpace } from '@/types/pm';

interface UsePmSidebarSortableOptions {
    workspaceSlug: string;
    spaces: PmSpace[];
    canReorderSpaces: boolean;
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

function idsFromContainer(container: HTMLElement, selector: string): number[] {
    return [...container.querySelectorAll<HTMLElement>(selector)]
        .map((el) => Number(el.dataset.id))
        .filter((id) => id > 0);
}

export function pmSidebarSignature(spaces: PmSpace[]): string {
    return spaces
        .map((space) => {
            const lists = (space.task_lists ?? []).map((l) => l.id).join('.');
            const sprints = (space.sprints ?? []).map((s) => s.id).join('.');
            return `${space.id}:${lists}/${sprints}`;
        })
        .join('|');
}

export function usePmSidebarSortable({
    workspaceSlug,
    spaces,
    canReorderSpaces,
    enabled = true,
}: UsePmSidebarSortableOptions): void {
    const instancesRef = useRef<Sortable[]>([]);
    const signature = pmSidebarSignature(spaces);

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

        const persistSpaces = (spaceIds: number[]): void => {
            router.post(
                route('pm.nav.reorder', workspaceSlug),
                { space_ids: spaceIds },
                { preserveScroll: true, preserveState: true },
            );
        };

        const persistLists = (spaceId: number, listIds: number[]): void => {
            router.post(
                route('pm.nav.reorder', workspaceSlug),
                { spaces: [{ space_id: spaceId, list_ids: listIds }] },
                { preserveScroll: true, preserveState: true },
            );
        };

        const persistSprints = (spaceId: number, sprintIds: number[]): void => {
            router.post(
                route('pm.nav.reorder', workspaceSlug),
                { spaces: [{ space_id: spaceId, sprint_ids: sprintIds }] },
                { preserveScroll: true, preserveState: true },
            );
        };

        const bindColumn = (
            column: HTMLElement,
            selector: string,
            onSorted: (ids: number[]) => void,
        ): void => {
            instancesRef.current.push(
                Sortable.create(column, {
                    animation: 150,
                    draggable: selector,
                    handle: '.pm-nav-drag-handle',
                    ghostClass: 'opacity-40',
                    filter: '.no-drag',
                    preventOnFilter: false,
                    onEnd: (event: SortableEvent) => {
                        if (event.oldIndex === event.newIndex) return;
                        const ids = idsFromContainer(event.to as HTMLElement, selector);
                        revertDrag(event.item as HTMLElement, event.from, event.oldIndex ?? -1);
                        onSorted(ids);
                    },
                }),
            );
        };

        const init = (): void => {
            if (cancelled) return;
            destroyAll();

            if (canReorderSpaces) {
                const spacesColumn = document.querySelector<HTMLElement>('.pm-spaces-column');
                if (spacesColumn) {
                    bindColumn(spacesColumn, '.pm-space-block', persistSpaces);
                }
            }

            spaces.forEach((space) => {
                if (!space.can_manage) return;

                const listsColumn = document.querySelector<HTMLElement>(
                    `.pm-lists-column[data-space-id="${space.id}"]`,
                );
                if (listsColumn) {
                    bindColumn(listsColumn, '.pm-list-nav', (ids) => persistLists(space.id, ids));
                }

                const sprintsColumn = document.querySelector<HTMLElement>(
                    `.pm-sprints-column[data-space-id="${space.id}"]`,
                );
                if (sprintsColumn) {
                    bindColumn(sprintsColumn, '.pm-sprint-nav', (ids) => persistSprints(space.id, ids));
                }
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
    }, [canReorderSpaces, enabled, signature, workspaceSlug, spaces]);
}
