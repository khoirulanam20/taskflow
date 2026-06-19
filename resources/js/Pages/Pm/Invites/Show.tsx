import { FormEventHandler } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';

interface InviteShowProps {
    invite: {
        token: string;
        email: string;
        role: string;
        workspace: { name: string; slug: string };
        expires_at: string;
    };
    emailMismatch: boolean;
}

export default function InviteShow({ invite, emailMismatch }: InviteShowProps) {
    const accept: FormEventHandler = (e) => {
        e.preventDefault();
        router.post(route('pm.invites.accept', invite.token));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
            <Head title={`Undangan - ${invite.workspace.name}`} />
            <div className="card w-full max-w-md space-y-4 p-6">
                <h1 className="text-xl font-semibold">Undangan Workspace</h1>
                <p className="text-sm text-text-secondary">
                    Kamu diundang ke <strong>{invite.workspace.name}</strong> sebagai{' '}
                    <span className="capitalize">{invite.role}</span>.
                </p>

                {emailMismatch ? (
                    <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                        Login dengan <strong>{invite.email}</strong> untuk menerima undangan ini.
                    </p>
                ) : (
                    <form onSubmit={accept}>
                        <Button type="submit" className="w-full">
                            Terima undangan
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
