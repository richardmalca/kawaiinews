import { CategoryBadge } from '@/components/public/category-badge';
import { FALLBACK_IMAGES, handleImageFallback } from '@/lib/utils';
import type { PublicArticle } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, Calendar } from 'lucide-react';

interface HeroFeaturedProps {
    article: PublicArticle;
}

export function HeroFeatured({ article }: HeroFeaturedProps) {
    const imageSrc = article.featured_image || FALLBACK_IMAGES.hero;

    return (
        <Link
            href={`/noticias/${article.slug}`}
            className="group relative block overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60 dark:shadow-none"
        >
            <article>
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
                    <div className="relative h-72 overflow-hidden lg:col-span-7 lg:h-[420px]">
                        <img
                            src={imageSrc}
                            alt={article.title}
                            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                            onError={(e) =>
                                handleImageFallback(e, FALLBACK_IMAGES.hero)
                            }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/80 dark:from-neutral-950 dark:via-neutral-950/20 dark:lg:to-neutral-950" />
                    </div>

                    <div className="flex flex-col justify-between p-6 lg:col-span-5 lg:p-8">
                        <div>
                            <div className="mb-4 flex items-center gap-2">
                                <CategoryBadge category={article.category} />
                                {article.published_at && (
                                    <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {article.published_at}
                                    </span>
                                )}
                            </div>

                            <h2 className="mb-4 text-2xl leading-snug font-black tracking-tight text-neutral-900 transition-colors group-hover:text-rose-600 lg:text-3xl dark:text-white dark:group-hover:text-rose-400">
                                {article.title}
                            </h2>

                            {article.excerpt && (
                                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-neutral-600 lg:line-clamp-4 dark:text-neutral-300">
                                    {article.excerpt}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 transition-colors group-hover:text-rose-500 dark:text-rose-400 dark:group-hover:text-rose-300">
                                Leer noticia completa
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                            <span className="font-mono text-[11px] tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                                Destacado
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
