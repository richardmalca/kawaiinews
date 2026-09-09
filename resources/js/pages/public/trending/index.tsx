import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { HomePagination } from '@/pages/public/home/components/home-pagination';
import { NewsCard } from '@/pages/public/home/components/news-card';
import type { PublicCategorySummary, PublicPaginatedArticles } from '@/types';
import { ArrowLeft, Flame, Sparkles, TrendingUp } from 'lucide-react';

interface TrendingPageProps {
    articles: PublicPaginatedArticles;
    categories: Record<string, PublicCategorySummary>;
}

export default function TrendingIndex({
    articles,
    categories,
}: TrendingPageProps) {
    return (
        <PublicLayout categories={categories}>
            <Head title="Tendencias y Noticias Populares - KawaiiNews" />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a la portada</span>
                </Link>
            </div>

            <div className="mb-8 rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent p-6 sm:p-8 dark:border-neutral-800/80 dark:from-amber-500/15 dark:via-rose-500/10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/20">
                            <Flame className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                                    Tendencias & Populares
                                </h1>
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-300">
                                    <TrendingUp className="h-3 w-3" />
                                    Top 14 días
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
                                Las noticias con mayor impacto, lecturas e
                                interés de la comunidad en los últimos 14 días.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {articles.data.length > 0 ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.data.map((article, index) => (
                            <div key={article.id} className="relative">
                                <div className="pointer-events-none absolute -top-2 -left-2 z-10 flex h-7 w-7 items-center justify-center rounded-xl bg-neutral-900 font-mono text-xs font-black text-white shadow-md dark:bg-white dark:text-neutral-950">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <NewsCard article={article} />
                            </div>
                        ))}
                    </div>

                    <HomePagination links={articles.links} />
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-neutral-400" />
                    No hay noticias en tendencia en este momento.
                </div>
            )}
        </PublicLayout>
    );
}
