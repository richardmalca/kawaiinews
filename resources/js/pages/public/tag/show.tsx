import { SeoHead } from '@/components/common/seo-head';
import PublicLayout from '@/layouts/public-layout';
import { HomePagination } from '@/pages/public/home/components/home-pagination';
import { NewsCard } from '@/pages/public/home/components/news-card';
import type { PublicCategorySummary, PublicPaginatedArticles, PublicTag } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, Newspaper, Plus, Sparkles, Tag as TagIcon, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { readCsrfToken } from '../profile/lib/profile-utils';

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
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    const [isFollowing, setIsFollowing] = useState(Boolean(tag.is_following));
    const [followersCount, setFollowersCount] = useState(tag.followers_count ?? 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleFollow = async () => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);
        const prevFollowing = isFollowing;
        const prevCount = followersCount;

        setIsFollowing(!prevFollowing);
        setFollowersCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);

        try {
            const res = await fetch(`/tag/${tag.slug}/seguir`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                setIsFollowing(prevFollowing);
                setFollowersCount(prevCount);
                toast.error('No se pudo actualizar el seguimiento');
                return;
            }

            const data = (await res.json()) as { following: boolean; followers_count: number };
            setIsFollowing(data.following);
            setFollowersCount(data.followers_count);
            if (data.following) {
                toast.success(`Ahora sigues el tag #${tag.name}`);
            } else {
                toast(`Dejaste de seguir #${tag.name}`);
            }
        } catch {
            setIsFollowing(prevFollowing);
            setFollowersCount(prevCount);
            toast.error('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

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

            <div className="mb-8 overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent p-4 sm:p-7 dark:border-rose-500/20 dark:from-rose-500/15 dark:via-pink-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                        <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25">
                            <TagIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl md:text-3xl dark:text-white">
                                    #{tag.name}
                                </h1>
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-300">
                                    <Newspaper className="h-3 w-3" />
                                    {totalCount} {totalCount === 1 ? 'noticia' : 'noticias'}
                                </span>
                                {followersCount > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/60 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                                        <Users className="h-3 w-3" />
                                        {followersCount} {followersCount === 1 ? 'seguidor' : 'seguidores'}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                                Todas las noticias y publicaciones relacionadas con #{tag.name} organizadas cronológicamente.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleFollow}
                            disabled={isSubmitting}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                                isFollowing
                                    ? 'border border-neutral-300 bg-white text-neutral-800 hover:border-rose-300 hover:text-rose-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:text-rose-400'
                                    : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-rose-500/20'
                            }`}
                        >
                            {isFollowing ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Siguiendo tag</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Seguir tag</span>
                                </>
                            )}
                        </button>
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
