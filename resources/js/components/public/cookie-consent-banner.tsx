import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'kawaiinews_cookie_consent';

export function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Small delay so it doesn't pop aggressively immediately upon render
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setIsVisible(false);
    };

    const handleDismiss = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <aside
            aria-label="Aviso de cookies"
            className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-300 sm:left-6 sm:right-auto sm:max-w-md"
        >
            <div className="rounded-3xl border border-neutral-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-neutral-800/90 dark:bg-neutral-900/95">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                        <Cookie className="h-5 w-5" />
                    </div>

                    <div className="flex-1 text-xs">
                        <h4 className="font-bold text-neutral-900 dark:text-white">
                            Respetamos tu privacidad
                        </h4>
                        <p className="mt-1 text-neutral-600 leading-relaxed dark:text-neutral-400">
                            Usamos cookies técnicas esenciales y de publicidad no intrusiva para mantener la web funcionando y gratuita.
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAccept}
                                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-500 active:scale-95"
                            >
                                Entendido y aceptar
                            </button>
                            <Link
                                href="/cookies"
                                className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition"
                            >
                                Ver política
                            </Link>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title="Cerrar aviso"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
