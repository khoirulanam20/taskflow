import IconoirIcon from '@/Components/IconoirIcon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

interface TaskRowMenuProps {
    onDetail: () => void;
    onDelete?: () => void;
}

export default function TaskRowMenu({ onDetail, onDelete }: TaskRowMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="btn-icon-secondary no-drag h-7 w-7 p-0"
                    aria-label="Aksi task"
                    onClick={(e) => e.stopPropagation()}
                >
                    <IconoirIcon name="more-vert" className="text-sm" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDetail}>
                    <IconoirIcon name="eye" className="text-base" />
                    Detail
                </DropdownMenuItem>
                {onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-danger focus:text-danger">
                        <IconoirIcon name="trash" className="text-base" />
                        Hapus
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
