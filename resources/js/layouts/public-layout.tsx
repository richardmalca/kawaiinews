import type { ReactNode } from 'react';
import type { PublicCategorySummary } from '@/types';
import { BackToTop } from '@/components/public/back-to-top';
import { PublicFooter } from '@/components/public/footer';
import { PublicNavbar } from '@/components/public/navbar';
import { UsernameRequiredBanner } from '@/components/public/username-required-banner';
import { ChooseUsernameDialog } from '@/components/public/choose-username-dialog';
import { CookieConsentBanner } from '@/components/public/cookie-consent-banner';
import { AppToaster } from '@/components/app-toaster';
import { useFlashToast } from '@/hooks/use-flash-toast';

interface PublicLayoutProps {
    children: ReactNode;
    categories?: Record<string, PublicCategorySummary>;
    progress?: number;
}

export default function PublicLayout({
    children,
    categories,
    progress,
}: PublicLayoutProps) {
    useFlashToast();

    return (
        <div className="flex min-h-screen flex-col bg-neutral-50 font-sans text-neutral-900 transition-colors duration-200 selection:bg-rose-500 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
            <UsernameRequiredBanner />
            <PublicNavbar categories={categories} progress={progress} />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
            <PublicFooter />
            <BackToTop />
            <ChooseUsernameDialog />
            <CookieConsentBanner />
            <AppToaster />
        </div>
    );
}
