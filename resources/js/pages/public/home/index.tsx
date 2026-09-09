import { Head } from '@inertiajs/react';
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
    search?: string | null;
}

export default function Home({
    featured,
    articles,
    trending,
    categories,
    selectedCategory,
    search,
}: HomeProps) {
    const isFiltered = Boolean(selectedCategory || search);
    const featuredArticle = !isFiltered ? featured.data[0] : null;
    const gridArticles = featuredArticle
        ? articles.data.filter((a) => a.id !== featuredArticle.id)
        : articles.data;

    let pageTitle = 'KawaiiNews - Noticias de Anime, Manga y Gaming';
    if (search) {
        pageTitle = `Búsqueda: "${search}" - KawaiiNews`;
    } else if (selectedCategory && categories[selectedCategory]) {
        pageTitle = `${categories[selectedCategory].label} - KawaiiNews`;
    }

    return (
        <PublicLayout categories={categories}>
            <Head title={pageTitle} />

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
                    {trending.data.length > 0 && (
                        <TrendingSidebar articles={trending.data} />
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
