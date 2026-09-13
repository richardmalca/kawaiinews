import { CategoryBadge } from '@/components/public/category-badge';
import { FALLBACK_IMAGES, handleImageFallback } from '@/lib/utils';
import type { PublicArticle } from '@/types';
import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';

interface RelatedArticleCardProps {
    article: PublicArticle;
    className?: string;
}

export function RelatedArticleCard({
    article,
    className = '',
}: RelatedArticleCardProps) {
    return (
        <Link
            href={`/noticias/${article.slug}`}
            className={`group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/80 ${className}`}
        >
            <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                <img
                    src={article.featured_image || FALLBACK_IMAGES.card}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => handleImageFallback(e, FALLBACK_IMAGES.card)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-2 left-2 z-10">
                    <CategoryBadge
                        category={article.category}
                        className="px-2 py-0 text-[10px] shadow-xs"
                    />
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                <div>
                    {article.published_at && (
                        <span className="mb-1.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{article.published_at}</span>
                        </span>
                    )}
                    <h3 className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400">
                        {article.title}
                    </h3>
                </div>
            </div>
        </Link>
    );
}
