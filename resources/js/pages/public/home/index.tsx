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
                    />

                    {gridArticles.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {gridArticles.map((article) => (
                                <NewsCard key={article.id} article={article} />
                            ))}
                        </div>
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
