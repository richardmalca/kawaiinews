import { CategoryBadge } from '@/components/public/category-badge';
import { QuickFavoriteButton } from '@/components/public/quick-favorite-button';
import {
    FALLBACK_IMAGES,
    estimateReadingTime,
    handleImageFallback,
} from '@/lib/utils';
import type { PublicArticle } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Bookmark, Calendar, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface NewsCardProps {
    article: PublicArticle;
}

export function NewsCard({ article }: NewsCardProps) {
    const imageSrc = article.featured_image || FALLBACK_IMAGES.card;
    const readingMinutes = estimateReadingTime(article.body);
    const likersCount = article.likers_count ?? 0;
    const favoritesCount = article.favorites_count ?? 0;
    const sharesCount = article.shares_count ?? 0;
    const commentsCount = article.comments_count ?? 0;

    return (
        <Link
            href={`/noticias/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:shadow-none dark:hover:border-neutral-700/80 dark:hover:bg-neutral-900/80"
        >
            <article className="flex flex-1 flex-col">
                <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                    <img
                        src={imageSrc}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                        loading="lazy"
                        onError={(e) =>
                            handleImageFallback(e, FALLBACK_IMAGES.card)
                        }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute top-3 left-3 z-10">
                        <CategoryBadge category={article.category} />
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                        <QuickFavoriteButton
                            slug={article.slug}
                            initialFavorited={article.has_favorited}
                            initialCount={favoritesCount}
                        />
                    </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                            {article.published_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {article.published_at}
                                </span>
                            )}
                            <span className="text-neutral-300 dark:text-neutral-700">
                                •
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3 text-rose-500 dark:text-rose-400" />
                                {readingMinutes} min
                            </span>
                            {typeof article.views_count === 'number' && (
                                <>
                                    <span className="text-neutral-300 dark:text-neutral-700">
                                        •
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3 text-neutral-400" />
                                        {article.views_count}
                                    </span>
                                </>
                            )}
                        </div>

                        <h3 className="line-clamp-2 text-base leading-snug font-bold text-neutral-900 transition-colors group-hover:text-rose-500 dark:text-white dark:group-hover:text-rose-400">
                            {article.title}
                        </h3>

                        {article.excerpt && (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                {article.excerpt}
                            </p>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs dark:border-neutral-800/60">
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
                                <span className="text-[11px] font-semibold">{likersCount}</span>
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
                                <span className="text-[11px] font-semibold">{favoritesCount}</span>
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
                                <span className="text-[11px] font-semibold">{sharesCount}</span>
                            </span>

                            <span
                                title="Comentarios"
                                className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                    commentsCount > 0
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : 'text-neutral-400 dark:text-neutral-500'
                                }`}
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-semibold">{commentsCount}</span>
                            </span>
                        </div>

                        <span className="font-medium text-rose-600 group-hover:underline dark:text-rose-400">
                            Ver detalles
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
