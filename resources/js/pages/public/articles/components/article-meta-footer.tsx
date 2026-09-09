import type { PublicArticle } from '@/types';
import { Calendar, Clock } from 'lucide-react';
import { ShareButtons } from './share-buttons';

interface ArticleMetaFooterProps {
    article: PublicArticle;
    sharesCount?: number;
    onShare?: (channel: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'link') => void;
}

export function ArticleMetaFooter({ article, sharesCount, onShare }: ArticleMetaFooterProps) {
    return (
        <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <ShareButtons
                    title={article.title}
                    sharesCount={sharesCount ?? article.shares_count}
                    onShare={onShare}
                />

                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {article.published_at_formatted && (
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                            <span>{article.published_at_formatted}</span>
                        </span>
                    )}
                    {article.published_at_formatted &&
                        article.published_at_time && (
                            <span className="text-neutral-300 dark:text-neutral-700">
                                •
                            </span>
                        )}
                    {article.published_at_time && (
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-neutral-400" />
                            <span>{article.published_at_time} hrs</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
