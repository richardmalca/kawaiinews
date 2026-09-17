import { useState } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import { usePwa } from '@/hooks/use-pwa';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

const DISMISS_KEY = 'kawaiinews_pwa_banner_dismissed';

function getDismissed(): boolean {
    if (typeof window === 'undefined') return true;
    try {
        if (localStorage.getItem(DISMISS_KEY) === 'true') return true;
        return document.cookie.split('; ').some((row) => row.startsWith(`${DISMISS_KEY}=true`));
    } catch {
        return false;
    }
}

function saveDismissed() {
    try {
        localStorage.setItem(DISMISS_KEY, 'true');
    } catch {}
    try {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        document.cookie = `${DISMISS_KEY}=true; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
    } catch {}
}

export function PwaInstallBanner() {
    const { isInstallable, isInstalled, isIos, installPwa } = usePwa();
    const [isDismissed, setIsDismissed] = useState<boolean>(getDismissed);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isIosModalOpen, setIsIosModalOpen] = useState(false);

    const handleDismiss = () => {
        setIsDismissed(true);
        saveDismissed();
    };

    const handleInstall = async () => {
        if (isIos) {
            setIsIosModalOpen(true);
            return;
        }

        setIsInstalling(true);
        try {
            await installPwa();
        } finally {
            setIsInstalling(false);
        }
    };

    const iosInstructionsDialog = (
        <Dialog open={isIosModalOpen} onOpenChange={setIsIosModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <Smartphone className="h-5 w-5 text-rose-500" />
                        <span>Instalar KawaiiNews en iPhone / iPad</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                        Apple requiere que agregues la aplicación manualmente desde Safari.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2 text-xs">
                    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                            <Share className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                1. Toca el botón Compartir
                            </p>
                            <p className="text-neutral-500 dark:text-neutral-400">
                                En la barra inferior o superior de Safari, presiona el ícono de compartir.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                            <PlusSquare className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                2. Selecciona &quot;Agregar a pantalla de inicio&quot;
                            </p>
                            <p className="text-neutral-500 dark:text-neutral-400">
                                Desplaza las opciones hacia abajo y elige la opción de agregar.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    if (isInstalled || isDismissed || !isInstallable) {
        return iosInstructionsDialog;
    }

    return (
        <>
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

            {iosInstructionsDialog}
        </>
    );
}
