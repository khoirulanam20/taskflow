import { PmKanbanColumn, PmSubtask, PmTask } from '@/types/pm';

export function flattenKanbanTasks(columns: PmKanbanColumn[]): PmTask[] {
    return columns.flatMap((col) => col.tasks ?? []);
}

export function subtaskToPmTask(sub: PmSubtask, parent?: PmTask): PmTask {
    const asTask: PmTask = {
        id: sub.id,
        title: sub.title,
        description: sub.description ?? null,
        status_id: sub.status_id,
        sprint_id: sub.sprint_id ?? null,
        priority: sub.priority ?? 'normal',
        due_date: sub.due_date ?? null,
        start_date: sub.start_date ?? null,
        assignees: sub.assignees ?? [],
        status: sub.status,
        list_name: parent?.list_name,
        subtasks: sub.subtasks ?? [],
        comments: sub.comments ?? [],
        tags: sub.tags ?? [],
        attachments: sub.attachments ?? [],
    };

    return asTask;
}

function findInSubtasks(subtasks: PmSubtask[], id: number, parent: PmTask): PmTask | null {
    for (const sub of subtasks) {
        if (sub.id === id) {
            return subtaskToPmTask(sub, parent);
        }
        if (sub.subtasks?.length) {
            const asParent = subtaskToPmTask(sub, parent);
            const found = findInSubtasks(sub.subtasks, id, asParent);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

export function findPmTask(tasks: PmTask[], id: number): PmTask | null {
    for (const task of tasks) {
        if (task.id === id) {
            return task;
        }
        if (task.subtasks?.length) {
            const found = findInSubtasks(task.subtasks, id, task);
            if (found) {
                return found;
            }
        }
    }

    return null;
}
