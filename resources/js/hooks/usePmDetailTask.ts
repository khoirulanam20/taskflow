import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { findPmTask, flattenKanbanTasks } from '@/lib/pmTaskHelpers';
import { PmKanbanColumn, PmTag, PmTask } from '@/types/pm';

export { flattenKanbanTasks };

interface TaskDetailResponse {
    task: PmTask;
    tags: PmTag[];
}

export function usePmDetailTask(tasks: PmTask[], workspaceSlug: string) {
    const [detailTaskId, setDetailTaskId] = useState<number | null>(null);
    const [detailTask, setDetailTask] = useState<PmTask | null>(null);
    const [detailTags, setDetailTags] = useState<PmTag[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchDetail = useCallback(
        async (taskId: number) => {
            setDetailLoading(true);
            try {
                const res = await axios.get<TaskDetailResponse>(
                    route('pm.tasks.detail', [workspaceSlug, taskId]),
                );
                setDetailTask(res.data.task);
                setDetailTags(res.data.tags ?? []);
            } catch {
                setDetailTask(findPmTask(tasks, taskId));
                setDetailTags([]);
            } finally {
                setDetailLoading(false);
            }
        },
        [workspaceSlug, tasks],
    );

    useEffect(() => {
        if (detailTaskId === null) {
            setDetailTask(null);
            setDetailTags([]);
            return;
        }
        void fetchDetail(detailTaskId);
    }, [detailTaskId, tasks, fetchDetail]);

    const openDetail = useCallback((task: PmTask) => {
        setDetailTaskId(task.id);
        setDetailTask(findPmTask(tasks, task.id) ?? task);
    }, [tasks]);

    const closeDetail = useCallback(() => setDetailTaskId(null), []);

    return {
        detailTask,
        detailTags,
        detailLoading,
        detailOpen: detailTaskId !== null,
        openDetail,
        closeDetail,
    };
}
