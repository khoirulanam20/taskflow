<?php

namespace App\Enums;

enum WorkspaceRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Member = 'member';

    public function canManageMembers(): bool
    {
        return $this === self::Owner || $this === self::Admin;
    }

    public function canManageStructure(): bool
    {
        return $this === self::Owner || $this === self::Admin;
    }

    public function canDeleteWorkspace(): bool
    {
        return $this === self::Owner;
    }
}
