import { SeoHead } from '@/components/common/seo-head';
import PublicLayout from '@/layouts/public-layout';
import { HomePagination } from '@/pages/public/home/components/home-pagination';
import { NewsCard } from '@/pages/public/home/components/news-card';
import type { PublicCategorySummary, PublicPaginatedArticles, PublicTag } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Newspaper, Sparkles, Tag as TagIcon } from 'lucide-react';

interface TagShowProps {
    tag: PublicTag;
    articles: PublicPaginatedArticles;
    categories: Record<string, PublicCategorySummary>;
}

export default function TagShow({
    tag,
    articles,
    categories,
}: TagShowProps) {
    const pageTitle = `#${tag.name} - Noticias y Artículos - KawaiiNews`;
    const pageDescription = `Explora todas las noticias, novedades y artículos etiquetados con #${tag.name} en KawaiiNews.`;
    const totalCount = tag.articles_count ?? articles.data.length;

    return (
        <PublicLayout categories={categories}>
            <SeoHead
                title={pageTitle}
                description={pageDescription}
                canonicalUrl={`/tag/${tag.slug}`}
            />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>
                        <span className="sm:hidden">Volver</span>
                        <span className="hidden sm:inline">Volver a la portada</span>
                    </span>
                </Link>
            </div>

            <div className="mb-8 rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent p-6 sm:p-8 dark:border-neutral-800/80 dark:from-rose-500/15 dark:via-pink-500/10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/20">
                            <TagIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                                    #{tag.name}
                                </h1>
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-300">
                                    <Newspaper className="h-3 w-3" />
                                    {totalCount} {totalCount === 1 ? 'noticia' : 'noticias'}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
                                Todas las noticias y publicaciones relacionadas con #{tag.name} organizadas cronológicamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {articles.data.length > 0 ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.data.map((article) => (
                            <NewsCard key={article.id} article={article} />
                        ))}
                    </div>

                    <HomePagination links={articles.links} />
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-neutral-400" />
                    No hay noticias publicadas con esta etiqueta por el momento.
                </div>
            )}
        </PublicLayout>
    );
}
