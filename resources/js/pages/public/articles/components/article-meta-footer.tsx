import type { PublicArticle } from '@/types';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { ShareButtons } from './share-buttons';

interface ArticleMetaFooterProps {
    article: PublicArticle;
    sharesCount?: number;
    onShare?: (channel: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'native' | 'link') => void;
}

export function ArticleMetaFooter({ article, sharesCount, onShare }: ArticleMetaFooterProps) {
    const references = article.references ?? [];

    return (
        <div className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            {references.length > 0 && (
                <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-900/40">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Fuentes y créditos de la noticia
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {references.map((ref) => (
                            <a
                                key={ref.id}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-2xs transition-colors hover:border-rose-400 hover:text-rose-600 dark:border-neutral-700/80 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:border-rose-500 dark:hover:text-rose-400"
                            >
                                <span>{ref.source_label}</span>
                                <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <ShareButtons
                    title={article.title}
                    text={article.excerpt}
                    category={article.category}
                    url={article.canonical_url}
                    featuredImage={article.featured_image}
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
