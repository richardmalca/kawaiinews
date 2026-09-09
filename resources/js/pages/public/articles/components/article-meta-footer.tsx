import type { PublicArticle } from '@/types';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { ShareButtons } from './share-buttons';

interface ArticleMetaFooterProps {
    article: PublicArticle;
}

export function ArticleMetaFooter({ article }: ArticleMetaFooterProps) {
    return (
        <div className="space-y-6 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <ShareButtons title={article.title} />

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                    {article.published_at_formatted && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-neutral-100/60 px-2.5 py-1 dark:border-neutral-800/80 dark:bg-neutral-900/60">
                            <Calendar className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                            <span>{article.published_at_formatted}</span>
                        </span>
                    )}
                    {article.published_at_time && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-neutral-100/60 px-2.5 py-1 dark:border-neutral-800/80 dark:bg-neutral-900/60">
                            <Clock className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                            <span>{article.published_at_time} hrs</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/70 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div>
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        Redacción KawaiiNews
                    </span>
                    <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        Publicado {article.published_at ?? 'recientemente'}
                    </span>
                </div>
            </div>
        </div>
    );
}
