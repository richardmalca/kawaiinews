import { SeoHead } from '@/components/common/seo-head';
import PublicLayout from '@/layouts/public-layout';
import type {
    PublicArticle,
    PublicCategorySummary,
    PublicPaginatedArticles,
} from '@/types';
import { HeroFeatured } from './components/hero-featured';
import { HomeEmptyState } from './components/home-empty-state';
import { HomePagination } from './components/home-pagination';
import { NewsCard } from './components/news-card';
import { NewsSectionHeader } from './components/news-section-header';
import { TrendingSidebar } from './components/trending-sidebar';
import { AdBanner } from '@/components/public/ad-banner';
import { BreakingNewsTicker } from '@/components/public/breaking-news-ticker';
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Calendar, Eye, Heart } from 'lucide-react';
import { CategoryBadge } from '@/components/public/category-badge';
import { FALLBACK_IMAGES, handleImageFallback } from '@/lib/utils';
import { QuickFavoriteButton } from '@/components/public/quick-favorite-button';

interface HomeProps {
    featured: { data: PublicArticle[] };
    articles: PublicPaginatedArticles;
    trending: { data: PublicArticle[] };
    categories: Record<string, PublicCategorySummary>;
    selectedCategory: string | null;
    isFollowingCategory?: boolean;
    categoryFollowersCount?: number;
    search?: string | null;
}

export default function Home({
    featured,
    articles,
    trending,
    categories = {},
    selectedCategory,
    isFollowingCategory = false,
    categoryFollowersCount = 0,
    search,
}: HomeProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
    const isFiltered = Boolean(selectedCategory || search);
    const featuredArticles = featured?.data ?? [];
    const articleList = articles?.data ?? [];
    const featuredArticle = !isFiltered ? featuredArticles[0] ?? null : null;
    const gridArticles = featuredArticle
        ? articleList.filter((a) => a.id !== featuredArticle.id)
        : articleList;

    let pageTitle = 'KawaiiNews - Noticias de Anime, Manga y Gaming';
    let pageDescription =
        'Tu portal definitivo de noticias de anime, manga, videojuegos y cultura otaku al instante.';
    if (search) {
        pageTitle = `Búsqueda: "${search}" - KawaiiNews`;
        pageDescription = `Resultados de búsqueda para "${search}" en KawaiiNews.`;
    } else if (selectedCategory && categories[selectedCategory]) {
        pageTitle = `${categories[selectedCategory].label} - KawaiiNews`;
        pageDescription = `Las mejores noticias y novedades de ${categories[selectedCategory].label} en KawaiiNews.`;
    }

    return (
        <PublicLayout categories={categories}>
            <SeoHead
                title={pageTitle}
                description={pageDescription}
                ogImage={featuredArticle?.featured_image}
            />

            {(trending?.data?.length > 0 || featuredArticles.length > 0) && (
                <div className="mb-6">
                    <BreakingNewsTicker
                        articles={trending?.data?.length > 0 ? trending.data : featuredArticles}
                    />
                </div>
            )}

            {featuredArticle && !isFiltered && (
                <section className="mb-10">
                    <HeroFeatured article={featuredArticle} />
                </section>
            )}

            <div
                id="noticias-principales"
                className="grid scroll-mt-24 grid-cols-1 items-start gap-8 lg:grid-cols-12"
            >
                <div className="space-y-6 lg:col-span-8">
                    <NewsSectionHeader
                        selectedCategory={selectedCategory}
                        categories={categories}
                        search={search}
                        isFollowingCategory={isFollowingCategory}
                        categoryFollowersCount={categoryFollowersCount}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />

                    {gridArticles.length > 0 ? (
                        <>
                            {viewMode === 'grid' ? (
                                <>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {gridArticles.slice(0, 4).map((article) => (
                                            <NewsCard key={article.id} article={article} />
                                        ))}
                                    </div>

                                    <AdBanner format="inline" />

                                    {gridArticles.length > 4 && (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {gridArticles.slice(4).map((article) => (
                                                <NewsCard key={article.id} article={article} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:divide-neutral-800/60 dark:border-neutral-800/80 dark:bg-neutral-900/40">
                                    {gridArticles.map((article) => {
                                        const img = article.featured_image || FALLBACK_IMAGES.card;
                                        return (
                                            <div
                                                key={article.id}
                                                className="group relative flex items-center justify-between gap-4 p-4 transition-colors hover:bg-neutral-50/80 sm:p-5 dark:hover:bg-neutral-800/40"
                                            >
                                                <Link
                                                    href={`/noticias/${article.slug}`}
                                                    className="flex min-w-0 flex-1 items-center gap-4"
                                                >
                                                    <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-20 sm:w-28 dark:bg-neutral-950">
                                                        <img
                                                            src={img}
                                                            alt={article.title}
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            loading="lazy"
                                                            onError={(e) => handleImageFallback(e, FALLBACK_IMAGES.card)}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                            <CategoryBadge category={article.category} />
                                                            {article.published_at && (
                                                                <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {article.published_at}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 transition-colors group-hover:text-rose-600 sm:text-base dark:text-white dark:group-hover:text-rose-400">
                                                            {article.title}
                                                        </h3>
                                                        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
                                                            {typeof article.views_count === 'number' && (
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="h-3 w-3" />
                                                                    {article.views_count}
                                                                </span>
                                                            )}
                                                            {(article.likers_count ?? 0) > 0 && (
                                                                <span className="flex items-center gap-1 text-rose-500">
                                                                    <Heart className="h-3 w-3 fill-rose-500" />
                                                                    {article.likers_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className="shrink-0">
                                                    <QuickFavoriteButton
                                                        slug={article.slug}
                                                        initialFavorited={article.has_favorited}
                                                        initialCount={article.favorites_count ?? 0}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <HomeEmptyState />
                    )}

                    <HomePagination links={articles.links} />
                </div>

                <div
                    id="tendencias"
                    className="scroll-mt-24 space-y-6 transition-all duration-300 lg:sticky lg:top-32 lg:col-span-4"
                >
                    {trending?.data && trending.data.length > 0 && (
                        <TrendingSidebar articles={trending.data} />
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
