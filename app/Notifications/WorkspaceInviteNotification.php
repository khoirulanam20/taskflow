<?php

namespace App\Notifications;

use App\Models\Workspace;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkspaceInviteNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Workspace $workspace,
        protected string $token,
        protected string $inviterName,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('pm.invites.show', $this->token);

        return (new MailMessage)
            ->subject("Undangan workspace {$this->workspace->name}")
            ->greeting('Halo!')
            ->line("{$this->inviterName} mengundang kamu ke workspace {$this->workspace->name}.")
            ->action('Terima undangan', $url)
            ->line('Link berlaku 7 hari.');
    }
}
