export interface PmTag {
    id: number;
    name: string;
    color: string;
}

export interface PmTaskComment {
    id: number;
    body: string;
    created_at: string | null;
    user: PmTaskAssignee | null;
}

export interface PmTaskAttachment {
    id: number;
    type: 'link' | 'document' | 'markdown';
    original_name: string;
    url?: string | null;
    size: number;
    mime_type: string | null;
    created_at: string | null;
    uploader: { id: number; name: string } | null;
}

export interface PmSubtask {
    id: number;
    title: string;
    status_id: number;
    priority?: string;
    due_date?: string | null;
    start_date?: string | null;
    sprint_id?: number | null;
    description?: string | null;
    status: PmStatus | null;
    assignees?: PmTaskAssignee[];
    comments?: PmTaskComment[];
    tags?: PmTag[];
    attachments?: PmTaskAttachment[];
    subtasks?: PmSubtask[];
}

export interface PmSprint {
    id: number;
    name: string;
    status: string;
    start_date?: string | null;
    end_date?: string | null;
}

export interface PmWorkspace {
    id: number;
    name: string;
    slug: string;
    role?: string;
}

export interface PmSpace {
    id: number;
    name: string;
    color: string;
    icon: string | null;
    can_manage?: boolean;
    role?: string;
    task_lists: PmTaskListNav[];
    sprints?: PmSprint[];
}

export interface PmTaskListNav {
    id: number;
    name: string;
    space_id: number;
}

export interface PmMember {
    id: number;
    name: string;
    email?: string;
    username: string | null;
    avatar_url: string | null;
    avatar_initial: string;
    role?: string;
}

export interface PmStatus {
    id: number;
    name: string;
    color: string;
}

export interface PmTaskAssignee {
    id: number;
    name: string;
    avatar_url: string | null;
    avatar_initial: string;
}

export interface PmTask {
    id: number;
    title: string;
    description?: string | null;
    status_id: number;
    sprint_id: number | null;
    priority: string;
    due_date: string | null;
    start_date: string | null;
    assignees: PmTaskAssignee[];
    status: PmStatus | null;
    list_name?: string;
    subtasks?: PmSubtask[];
    comments?: PmTaskComment[];
    tags?: PmTag[];
    attachments?: PmTaskAttachment[];
}

export interface PmPriorityOption {
    value: string;
    label: string;
}

export interface PmKanbanColumn {
    id: number;
    name: string;
    color: string;
    tasks: PmTask[];
}
