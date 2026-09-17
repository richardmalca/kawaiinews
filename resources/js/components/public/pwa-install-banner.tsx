import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePwa } from '@/hooks/use-pwa';

const DISMISS_KEY = 'kawaiinews_pwa_banner_dismissed';

export function PwaInstallBanner() {
    const { isInstallable, isInstalled, installPwa } = usePwa();
    const [isDismissed, setIsDismissed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return sessionStorage.getItem(DISMISS_KEY) === 'true';
    });
    const [isInstalling, setIsInstalling] = useState(false);

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem(DISMISS_KEY, 'true');
    };

    const handleInstall = async () => {
        setIsInstalling(true);
        try {
            await installPwa();
        } finally {
            setIsInstalling(false);
        }
    };

    if (isInstalled || isDismissed || !isInstallable) {
        return null;
    }

    return (
        <aside
            aria-label="Instalar aplicación"
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-300 sm:left-auto sm:right-6 sm:max-w-md"
        >
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-neutral-800/90 dark:bg-neutral-900/95">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    <Smartphone className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Instalar KawaiiNews
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Acceso directo y navegación rápida sin barras del navegador.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Instalar</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        aria-label="Cerrar aviso de instalación"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
