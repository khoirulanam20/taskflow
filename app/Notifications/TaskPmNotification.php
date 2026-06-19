<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class TaskPmNotification extends Notification
{
    public function __construct(
        protected string $title,
        protected string $message,
        protected ?string $url = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
        ];
    }
}
