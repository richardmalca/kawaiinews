import { CategoryBadge } from '@/components/public/category-badge';
import {
    FALLBACK_IMAGES,
    formatNewsRanking,
    handleImageFallback,
} from '@/lib/utils';
import type { PublicArticle } from '@/types';
import { Link } from '@inertiajs/react';
import { Calendar, Eye, TrendingUp } from 'lucide-react';

interface TrendingSidebarProps {
    articles: PublicArticle[];
}

export function TrendingSidebar({ articles }: TrendingSidebarProps) {
    if (articles.length === 0) {
        return null;
    }

    return (
        <aside className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-none">
            <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                        <TrendingUp className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                            Noticias Populares
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            Artículos destacados de la redacción
                        </p>
                    </div>
                </div>

                <Link
                    href="/tendencias"
                    className="text-xs font-semibold text-rose-600 transition-colors hover:text-rose-700 hover:underline dark:text-rose-400"
                >
                    Ver todas
                </Link>
            </div>

            <div className="space-y-3.5">
                {articles.map((article, index) => (
                    <Link
                        key={article.id}
                        href={`/noticias/${article.slug}`}
                        className="group flex items-center gap-3.5 rounded-2xl border border-transparent p-2 transition-colors hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-800/50"
                    >
                        <span className="font-mono text-lg font-black text-neutral-400 transition-colors group-hover:text-rose-500 dark:text-neutral-600 dark:group-hover:text-rose-400">
                            {formatNewsRanking(index)}
                        </span>

                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100 shadow-2xs dark:border-neutral-800 dark:bg-neutral-950">
                            <img
                                src={
                                    article.featured_image ||
                                    FALLBACK_IMAGES.thumbnail
                                }
                                alt={article.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) =>
                                    handleImageFallback(
                                        e,
                                        FALLBACK_IMAGES.thumbnail,
                                    )
                                }
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <CategoryBadge
                                    category={article.category}
                                    className="px-1.5 py-0 text-[9px]"
                                />
                                {article.published_at && (
                                    <span className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                                        <Calendar className="h-2.5 w-2.5" />
                                        {article.published_at}
                                    </span>
                                )}
                                {typeof article.views_count === 'number' && (
                                    <span className="flex items-center gap-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                                        <Eye className="h-2.5 w-2.5" />
                                        {article.views_count}
                                    </span>
                                )}
                            </div>
                            <h4 className="line-clamp-2 text-xs leading-snug font-semibold text-neutral-800 transition-colors group-hover:text-rose-600 dark:text-neutral-200 dark:group-hover:text-rose-400">
                                {article.title}
                            </h4>
                        </div>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
