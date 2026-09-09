import { CategoryBadge } from '@/components/public/category-badge';
import { estimateReadingTime } from '@/lib/utils';
import type { PublicArticle } from '@/types';
import { BookOpen, Calendar, Eye } from 'lucide-react';
import { ArticleAudioPlayer } from './article-audio-player';

interface ArticleHeaderProps {
    article: PublicArticle;
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
    const readingMinutes = estimateReadingTime(article.body);

    return (
        <header className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <CategoryBadge category={article.category} />

                <ArticleAudioPlayer
                    title={article.title}
                    body={article.body}
                    audioUrl={article.audio_url}
                />
            </div>

            <h1 className="text-2xl leading-tight font-black tracking-tight text-neutral-950 sm:text-3xl lg:text-4xl dark:text-white">
                {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Por Redacción KawaiiNews
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">
                    •
                </span>
                {article.published_at && (
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{article.published_at}</span>
                    </span>
                )}
                <span className="text-neutral-300 dark:text-neutral-700">
                    •
                </span>
                <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                    <span>{readingMinutes} min de lectura</span>
                </span>
                {typeof article.views_count === 'number' && (
                    <>
                        <span className="text-neutral-300 dark:text-neutral-700">
                            •
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-neutral-400" />
                            <span>
                                {article.views_count.toLocaleString()} vistas
                            </span>
                        </span>
                    </>
                )}
            </div>

            {article.excerpt && (
                <p className="border-l-2 border-rose-500 pl-4 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-300">
                    {article.excerpt}
                </p>
            )}
        </header>
    );
}
