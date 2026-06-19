import IconoirIcon from '@/Components/IconoirIcon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

interface PmNavItemMenuProps {
    onEdit?: () => void;
    onAssign?: () => void;
    onDelete?: () => void;
    active?: boolean;
}

export default function PmNavItemMenu({ onEdit, onAssign, onDelete, active = false }: PmNavItemMenuProps) {
    if (!onEdit && !onAssign && !onDelete) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={
                        active
                            ? 'mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-100 hover:bg-gray-200/80'
                            : 'btn-icon-secondary mr-0.5 h-7 w-7 shrink-0 p-0 opacity-70 hover:opacity-100 group-hover:opacity-100'
                    }
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Aksi"
                >
                    <IconoirIcon name="more-vert" className="text-sm" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                        <IconoirIcon name="edit-pencil" className="text-base" />
                        Edit
                    </DropdownMenuItem>
                )}
                {onAssign && (
                    <DropdownMenuItem onClick={onAssign}>
                        <IconoirIcon name="group" className="text-base" />
                        Anggota
                    </DropdownMenuItem>
                )}
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
