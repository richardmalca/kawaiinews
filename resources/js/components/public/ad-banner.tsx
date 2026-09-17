import { useEffect, useRef, type HTMLAttributes } from 'react';

declare global {
    interface Window {
        adsbygoogle?: Array<Record<string, unknown>>;
    }
}

interface AdBannerProps extends HTMLAttributes<HTMLDivElement> {
    format?: 'leaderboard' | 'rectangle' | 'inline';
    label?: string;
    slot?: string;
    client?: string;
}

export function AdBanner({
    format = 'leaderboard',
    label = 'Publicidad',
    slot,
    client = 'ca-pub-2454606039462818',
    className = '',
    ...props
}: AdBannerProps) {
    const adRef = useRef<HTMLModElement | null>(null);
    const hasRequestedAdRef = useRef(false);

    useEffect(() => {
        if (!slot) return;

        if (!hasRequestedAdRef.current) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                hasRequestedAdRef.current = true;
            } catch {
                // Silencioso si los scripts de anuncios están bloqueados o aún no cargan
            }
        }
    }, [slot]);

    const formatStyles = {
        leaderboard: 'w-full min-h-[90px]',
        rectangle: 'w-full min-h-[250px]',
        inline: 'w-full min-h-[100px]',
    }[format];

    return (
        <div
            className={`my-6 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-neutral-200/80 bg-neutral-100/40 p-3 text-center dark:border-neutral-800/80 dark:bg-neutral-900/30 ${className}`}
            {...props}
        >
            <div className="mb-1.5 flex items-center justify-center gap-1">
                <span className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-400">
                    {label}
                </span>
            </div>

            <div
                className={`flex w-full items-center justify-center rounded-2xl bg-neutral-50/50 p-2 text-xs text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400 ${formatStyles}`}
            >
                {slot ? (
                    <ins
                        ref={adRef}
                        className="adsbygoogle"
                        style={{ display: 'block', width: '100%', textAlign: 'center' }}
                        data-ad-client={client}
                        data-ad-slot={slot}
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                    />
                ) : (
                    <div className="flex items-center justify-center py-6 text-neutral-400 dark:text-neutral-500 text-xs">
                        <span>Anuncio</span>
                    </div>
                )}
            </div>
        </div>
    );
}
