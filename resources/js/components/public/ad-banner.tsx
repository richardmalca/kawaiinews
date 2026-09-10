import type { HTMLAttributes } from 'react';

interface AdBannerProps extends HTMLAttributes<HTMLDivElement> {
    format?: 'leaderboard' | 'rectangle' | 'inline';
    label?: string;
}

export function AdBanner({
    format = 'leaderboard',
    label = 'Publicidad',
    className = '',
    ...props
}: AdBannerProps) {
    // Proporciones fijas recomendadas para evitar saltos bruscos en pantalla (CLS)
    const formatStyles = {
        leaderboard: 'w-full min-h-[90px] max-h-[120px]',
        rectangle: 'w-full min-h-[250px] max-h-[280px]',
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
                className={`flex items-center justify-center rounded-2xl bg-neutral-50/50 p-2 text-xs text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400 ${formatStyles}`}
            >
                {/* 
                  Espacio reservado para script de AdSense / Red publicitaria. 
                  Al ser un banner estático/placeholder, no intrusivo y adaptable.
                */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        Espacio publicitario no intrusivo
                    </span>
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                        Anuncios seleccionados para apoyar a KawaiiNews
                    </span>
                </div>
            </div>
        </div>
    );
}
