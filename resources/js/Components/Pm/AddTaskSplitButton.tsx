import IconoirIcon from '@/Components/IconoirIcon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

interface AddTaskMenuItem {
    label: string;
    onSelect: () => void;
}

interface AddTaskSplitButtonProps {
    onAdd: () => void;
    menuItems?: AddTaskMenuItem[];
    className?: string;
}

export default function AddTaskSplitButton({ onAdd, menuItems = [], className = '' }: AddTaskSplitButtonProps) {
    return (
        <div className={`inline-flex overflow-hidden rounded-md border border-border bg-white text-sm text-text-primary shadow-sm ${className}`}>
            <button
                type="button"
                onClick={onAdd}
                className="px-3 py-1.5 font-medium transition-colors hover:bg-gray-50"
            >
                Add Task
            </button>
            {menuItems.length > 0 && (
                <>
                    <span className="w-px self-stretch bg-border" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center px-2 py-1.5 transition-colors hover:bg-gray-50"
                                aria-label="Opsi tambah task"
                            >
                                <IconoirIcon name="nav-arrow-down" className="text-sm" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} onClick={item.onSelect}>
                                    {item.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        </div>
    );
}
