import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const [isAudioActive, setIsAudioActive] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        const handleAudioStatus = (e: Event) => {
            const customEvent = e as CustomEvent<{
                isInteracting: boolean;
            }>;
            if (customEvent.detail) {
                setIsAudioActive(Boolean(customEvent.detail.isInteracting));
            }
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        window.addEventListener('kawaii:audio-status-change', handleAudioStatus);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
            window.removeEventListener('kawaii:audio-status-change', handleAudioStatus);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Volver arriba"
            className={`fixed right-4 sm:right-6 z-40 flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200/80 bg-white/90 text-neutral-700 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:bg-rose-500 hover:text-white dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:border-rose-500 dark:hover:bg-rose-600 dark:hover:text-white ${
                isAudioActive
                    ? 'bottom-[calc(9rem+env(safe-area-inset-bottom,0px))] lg:bottom-20'
                    : 'bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6'
            }`}
        >
            <ArrowUp className="h-4 w-4" />
        </button>
    );
}
