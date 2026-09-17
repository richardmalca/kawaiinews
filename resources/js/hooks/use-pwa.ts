import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

export function usePwa() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
            document.referrer.includes('android-app://');
        const storedInstalled = localStorage.getItem('kawaiinews_pwa_installed') === 'true';
        return isStandalone || storedInstalled;
    });
    const [isStandalone, setIsStandalone] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
            document.referrer.includes('android-app://')
        );
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) ||
            (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
        setIsIos(isIosDevice);

        const checkStandalone = () => {
            const standalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
                document.referrer.includes('android-app://');
            setIsStandalone(standalone);
            if (standalone) {
                setIsInstalled(true);
                localStorage.setItem('kawaiinews_pwa_installed', 'true');
            }
        };

        checkStandalone();

        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
            localStorage.setItem('kawaiinews_pwa_installed', 'true');

            if (typeof window.gtag === 'function') {
                window.gtag('event', 'pwa_installed', {
                    event_category: 'PWA',
                    event_label: 'App Installed',
                });
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', checkStandalone);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            mediaQuery.removeEventListener('change', checkStandalone);
        };
    }, []);

    const installPwa = useCallback(async () => {
        if (!deferredPrompt) {
            return false;
        }

        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
            setIsInstalled(true);
            localStorage.setItem('kawaiinews_pwa_installed', 'true');
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'pwa_install_accepted', {
                    event_category: 'PWA',
                    event_label: 'Prompt Accepted',
                });
            }
        } else {
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'pwa_install_dismissed', {
                    event_category: 'PWA',
                    event_label: 'Prompt Dismissed',
                });
            }
        }

        setDeferredPrompt(null);
        return choiceResult.outcome === 'accepted';
    }, [deferredPrompt]);

    return {
        isInstallable: (!!deferredPrompt || isIos) && !isInstalled,
        isInstalled,
        isStandalone,
        isIos,
        installPwa,
    };
}
