import { useReadingProgress } from '@/hooks/use-reading-progress';
import PublicLayout from '@/layouts/public-layout';
import { TrendingSidebar } from '@/pages/public/home/components/trending-sidebar';
import type { PublicArticle, PublicCategorySummary } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ArticleAudioPlayer } from './components/article-audio-player';
import { ArticleContent } from './components/article-content';
import { ArticleHeader } from './components/article-header';
import { ArticleMetaFooter } from './components/article-meta-footer';
import { ArticleTags } from './components/article-tags';
import { RelatedArticles } from './components/related-articles';

interface ShowArticleProps {
    article: { data: PublicArticle };
    related: { data: PublicArticle[] };
    trending: { data: PublicArticle[] };
    categories: Record<string, PublicCategorySummary>;
}

export default function ShowArticle({
    article,
    related,
    trending,
    categories,
}: ShowArticleProps) {
    const item = article.data;
    const progress = useReadingProgress();

    return (
        <PublicLayout categories={categories} progress={progress}>
            <Head title={`${item.title} - KawaiiNews`} />

            <div className="mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a la portada</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
                <article className="space-y-8 lg:col-span-8">
                    <ArticleHeader article={item} />

                    <ArticleAudioPlayer
                        title={item.title}
                        body={item.body}
                        audioUrl={item.audio_url}
                    />

                    {item.featured_image && (
                        <div className="my-6 flex justify-center">
                            <figure className="inline-block overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-100 shadow-xs dark:border-neutral-800/60 dark:bg-neutral-900">
                                <img
                                    src={item.featured_image}
                                    alt={item.title}
                                    className="max-h-[300px] w-auto max-w-full object-contain sm:max-h-[340px]"
                                    loading="eager"
                                />
                            </figure>
                        </div>
                    )}

                    <div className="pt-2">
                        <ArticleContent body={item.body} />
                    </div>

                    <div className="pt-4">
                        <ArticleTags tags={item.tags} />
                    </div>

                    <ArticleMetaFooter article={item} />
                </article>

                <aside className="space-y-6 transition-all duration-300 lg:sticky lg:top-32 lg:col-span-4">
                    {trending.data.length > 0 && (
                        <TrendingSidebar articles={trending.data} />
                    )}
                </aside>
            </div>

            <div className="mt-16 border-t border-neutral-200/80 pt-10 dark:border-neutral-800/80">
                <RelatedArticles articles={related.data} />
            </div>
        </PublicLayout>
    );
}
