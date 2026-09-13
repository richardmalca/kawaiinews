import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            moderationAlerts: {
                blocked_comments: number;
                high_credibility_rumors: number;
            } | null;
            [key: string]: unknown;
        };
    }
}
