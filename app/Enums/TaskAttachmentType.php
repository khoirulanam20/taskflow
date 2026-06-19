<?php

namespace App\Enums;

enum TaskAttachmentType: string
{
    case Link = 'link';
    case Document = 'document';
    case Markdown = 'markdown';
}
