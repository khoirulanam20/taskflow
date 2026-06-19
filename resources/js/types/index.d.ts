import { User } from '@/types';

export interface MenuItem {
    label: string;
    route_name: string | null;
    url: string;
    icon: string | null;
    sort_order: number;
}

export interface MenuGroup {
    name: string;
    sort_order: number;
    menus: MenuItem[];
}

export interface SidebarNavigation {
    groups: MenuGroup[];
    ungrouped: MenuItem[];
}

export interface ThemeColors {
    primary: string;
    primary_hover: string;
    secondary: string;
    secondary_hover: string;
}

export interface FlashMessage {
    key: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
        permissions: string[];
    };
    app: {
        name: string;
        theme: ThemeColors;
        logoUrl: string | null;
        faviconUrl: string | null;
        googleOAuthEnabled: boolean;
    };
    sidebarNavigation: SidebarNavigation;
    dynamicMenus: MenuItem[];
    impersonating: boolean;
    flash: FlashMessage | null;
    errors: Record<string, string>;
    ziggy?: Record<string, unknown>;
};

export interface User {
    id: number;
    name: string;
    username: string | null;
    email: string;
    avatar_url: string | null;
    avatar_initial: string;
    roles: string[];
    completed_tours: Record<string, boolean>;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface Role {
    id: number;
    name: string;
    title: string;
    description?: string | null;
    is_active: boolean;
    permissions?: Array<{ id: number; name: string }>;
}

export interface PermissionItem {
    id: number;
    name: string;
    guard_name: string;
    display_label?: string;
}

export interface PermissionModule {
    label: string;
    code: string;
    permissions: PermissionItem[];
}

export interface PermissionGroup {
    name: string;
    code: string;
    sort_order: number;
    modules: PermissionModule[];
    is_system: boolean;
}

export interface ModuleAction {
    id: number;
    action: string;
    label?: string | null;
    is_enabled: boolean;
}

export interface ModuleRecord {
    id: number;
    module_group_id: number;
    title: string;
    code: string;
    layout_type: string;
    route_name: string | null;
    icon: string | null;
    description: string | null;
    is_active: boolean;
    show_in_sidebar: boolean;
    has_notifications: boolean;
    sort_order: number;
    actions?: ModuleAction[];
    group?: { id: number; name: string; code: string };
}

export interface ModuleGroupRecord {
    id: number;
    name: string;
    code: string;
    sort_order: number;
    is_active: boolean;
    modules: ModuleRecord[];
}

export interface MasterDataItem {
    id: number;
    name: string;
    description: string | null;
}

export interface WebSettingData {
    app_name: string;
    app_tagline: string | null;
    site_description: string | null;
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
    favicon_url: string | null;
}

export interface AppConfigData {
    google_client_id: string;
    google_redirect_uri: string;
    has_google_client_secret: boolean;
    mail_mailer: string;
    mail_host: string;
    mail_port: number | string;
    mail_username: string;
    mail_encryption: string;
    mail_from_address: string;
    mail_from_name: string;
    has_mail_password: boolean;
    ai_provider: string;
    ai_base_url: string;
    ai_model: string;
    has_ai_api_key: boolean;
}

export interface ActivityLogItem {
    id: number;
    description: string;
    event: string | null;
    subject_type: string | null;
    subject_type_label: string;
    subject_id: number | null;
    subject_label: string | null;
    causer: { id: number; name: string; email: string } | null;
    properties: Record<string, unknown> | null;
    created_at: string;
}

export interface ActivityLogFilterOptions {
    events: string[];
    subject_types: Array<{ value: string; label: string }>;
    causers: Array<{ id: number; name: string; email: string }>;
}

export interface NotificationItem {
    id: string;
    data: {
        title?: string;
        message?: string;
        body?: string;
    };
    read_at: string | null;
    created_at: string;
}
