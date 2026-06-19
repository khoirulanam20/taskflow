const priorityFill: Record<string, string> = {
    urgent: 'bg-danger',
    high: 'bg-warning',
    normal: 'bg-gray-300',
    low: 'bg-gray-300',
};

export function priorityDotClass(priority: string): string {
    return priorityFill[priority] ?? 'bg-gray-300';
}

export default function PriorityDot({
    priority,
    className = '',
}: {
    priority: string;
    className?: string;
}) {
    return (
        <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${priorityDotClass(priority)} ${className}`}
            aria-hidden
        />
    );
}
