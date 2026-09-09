import { CategoryBadge } from '@/components/public/category-badge';
import { FALLBACK_IMAGES, handleImageFallback } from '@/lib/utils';
import type { PublicArticle } from '@/types';
import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';

interface RelatedArticlesProps {
    articles: PublicArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
    if (!articles || articles.length === 0) {
        return null;
    }

    return (
        <section className="border-t border-neutral-200 pt-10 dark:border-neutral-800">
            <h2 className="mb-6 text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
                Noticias relacionadas
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {articles.map((item) => (
                    <Link
                        key={item.id}
                        href={`/noticias/${item.slug}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/80"
                    >
                        <div className="relative h-40 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                            <img
                                src={
                                    item.featured_image || FALLBACK_IMAGES.card
                                }
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) =>
                                    handleImageFallback(e, FALLBACK_IMAGES.card)
                                }
                            />
                            <div className="absolute top-2.5 left-2.5">
                                <CategoryBadge
                                    category={item.category}
                                    className="px-2 py-0 text-[10px]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-4">
                            <div>
                                {item.published_at && (
                                    <span className="mb-1.5 flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                        <Calendar className="h-3 w-3" />
                                        {item.published_at}
                                    </span>
                                )}
                                <h3 className="line-clamp-2 text-sm leading-snug font-bold text-neutral-900 transition-colors group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400">
                                    {item.title}
                                </h3>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
