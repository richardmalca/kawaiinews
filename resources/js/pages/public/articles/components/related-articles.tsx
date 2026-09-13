import { useEffect, useRef, useState } from 'react';
import type { PublicArticle } from '@/types';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { RelatedArticleCard } from './related-article-card';

interface RelatedArticlesProps {
    articles: PublicArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
    if (!articles || articles.length === 0) {
        return null;
    }

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }

        const interval = setInterval(() => {
            if (isPaused) {
                return;
            }

            const isMobile = window.innerWidth < 768;
            if (!isMobile) {
                return;
            }

            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            if (container.scrollLeft >= maxScrollLeft - 8) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: 240, behavior: 'smooth' });
            }
        }, 3500);

        return () => clearInterval(interval);
    }, [isPaused]);

    const handleScroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }

        const distance = 260;
        container.scrollBy({
            left: direction === 'left' ? -distance : distance,
            behavior: 'smooth',
        });
    };

    return (
        <section className="border-t border-neutral-200/80 pt-8 sm:pt-10 dark:border-neutral-800/80">
            <div className="mb-4 flex items-center justify-between sm:mb-5">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                        <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg dark:text-white">
                        Noticias relacionadas
                    </h2>
                </div>

                <div className="flex items-center gap-1 md:hidden">
                    <button
                        type="button"
                        onClick={() => handleScroll('left')}
                        aria-label="Desplazar a la izquierda"
                        className="flex h-7 w-7 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-neutral-600 shadow-xs transition-colors hover:bg-neutral-100 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleScroll('right')}
                        aria-label="Desplazar a la derecha"
                        className="flex h-7 w-7 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-neutral-600 shadow-xs transition-colors hover:bg-neutral-100 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
                className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:p-0"
            >
                {articles.map((item) => (
                    <div
                        key={item.id}
                        className="w-[240px] shrink-0 sm:w-[260px] md:w-auto md:shrink"
                    >
                        <RelatedArticleCard article={item} className="h-full" />
                    </div>
                ))}
            </div>
        </section>
    );
}
