import { CategoryBadge } from '@/components/public/category-badge';
import {
    FALLBACK_IMAGES,
    estimateReadingTime,
    handleImageFallback,
} from '@/lib/utils';
import type { PublicArticle } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Bookmark, Calendar, Eye, Flame, Heart, Share2 } from 'lucide-react';

interface HeroFeaturedProps {
    article: PublicArticle;
}

export function HeroFeatured({ article }: HeroFeaturedProps) {
    const imageSrc = article.featured_image || FALLBACK_IMAGES.hero;
    const readingMinutes = estimateReadingTime(article.body);
    const likersCount = article.likers_count ?? 0;
    const favoritesCount = article.favorites_count ?? 0;
    const sharesCount = article.shares_count ?? 0;

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
                            loading="eager"
                            onError={(e) =>
                                handleImageFallback(e, FALLBACK_IMAGES.hero)
                            }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/80 dark:from-neutral-950 dark:via-neutral-950/20 dark:lg:to-neutral-950" />
                        <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-600/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                                <Flame className="h-3.5 w-3.5 animate-pulse fill-amber-300 text-amber-300" />
                                <span>Destacado</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between p-6 lg:col-span-5 lg:p-8">
                        <div>
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <CategoryBadge category={article.category} />
                                {article.published_at && (
                                    <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {article.published_at}
                                    </span>
                                )}
                                <span className="text-neutral-300 dark:text-neutral-700">
                                    •
                                </span>
                                <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    <BookOpen className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                                    {readingMinutes} min
                                </span>
                                {typeof article.views_count === 'number' && (
                                    <>
                                        <span className="text-neutral-300 dark:text-neutral-700">
                                            •
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                            <Eye className="h-3.5 w-3.5 text-neutral-400" />
                                            {article.views_count} vistas
                                        </span>
                                    </>
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
                            <div className="flex items-center gap-3">
                                <span
                                    title="Me gusta"
                                    className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                        likersCount > 0
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-neutral-400 dark:text-neutral-500'
                                    }`}
                                >
                                    <Heart
                                        className={`h-3.5 w-3.5 ${
                                            likersCount > 0
                                                ? 'fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400'
                                                : ''
                                        }`}
                                    />
                                    <span className="text-xs font-semibold">{likersCount}</span>
                                </span>

                                <span
                                    title="Guardado en favoritos"
                                    className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                        favoritesCount > 0
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-neutral-400 dark:text-neutral-500'
                                    }`}
                                >
                                    <Bookmark
                                        className={`h-3.5 w-3.5 ${
                                            favoritesCount > 0
                                                ? 'fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400'
                                                : ''
                                        }`}
                                    />
                                    <span className="text-xs font-semibold">{favoritesCount}</span>
                                </span>

                                <span
                                    title="Veces compartido"
                                    className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                        sharesCount > 0
                                            ? 'text-sky-600 dark:text-sky-400'
                                            : 'text-neutral-400 dark:text-neutral-500'
                                    }`}
                                >
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">{sharesCount}</span>
                                </span>
                            </div>

                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 transition-colors group-hover:text-rose-500 dark:text-rose-400 dark:group-hover:text-rose-300">
                                Leer noticia completa
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
