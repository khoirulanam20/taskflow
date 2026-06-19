import { Component, ErrorInfo, ReactNode } from 'react';
import IconoirIcon from '@/Components/IconoirIcon';
import { Button } from '@/Components/ui/button';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('UI error boundary:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-6">
                    <div className="card w-full max-w-md space-y-4 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                            <IconoirIcon name="warning-circle" className="text-2xl" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-text-primary">
                                Terjadi kesalahan pada tampilan
                            </h2>
                            <p className="text-sm text-text-secondary">
                                Muat ulang halaman. Jika masalah berlanjut, hubungi administrator.
                            </p>
                        </div>
                        <Button type="button" className="w-full sm:w-auto" onClick={() => window.location.reload()}>
                            Muat ulang
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
