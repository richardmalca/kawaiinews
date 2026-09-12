import { Link } from '@inertiajs/react';
import { Flame, Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PublicArticle } from '@/types';

interface BreakingNewsTickerProps {
    articles?: PublicArticle[];
}

export function BreakingNewsTicker({ articles = [] }: BreakingNewsTickerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!articles || articles.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % articles.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [articles]);

    if (!articles || articles.length === 0) return null;

    const current = articles[currentIndex];

    return (
        <div className="mb-6 flex items-center gap-3 overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-50/60 p-2 sm:px-4 sm:py-2.5 backdrop-blur-xs dark:border-rose-950/40 dark:bg-rose-950/20">
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                <Flame className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                <span className="hidden xs:inline">Última Hora</span>
                <span className="xs:hidden">Top</span>
            </div>

            <div className="relative min-w-0 flex-1 overflow-hidden">
                <Link
                    href={`/noticias/${current.slug}`}
                    className="block truncate text-xs font-semibold text-neutral-800 transition-all hover:text-rose-600 dark:text-neutral-200 dark:hover:text-rose-400"
                >
                    <span className="mr-2 inline-block font-bold text-rose-600 dark:text-rose-400">
                        [{current.category.toUpperCase()}]
                    </span>
                    {current.title}
                </Link>
            </div>

            <div className="hidden items-center gap-1 text-[11px] font-medium text-neutral-400 sm:flex">
                <TrendingUp className="h-3 w-3 text-rose-500" />
                <span>{currentIndex + 1} de {articles.length}</span>
            </div>
        </div>
    );
}
