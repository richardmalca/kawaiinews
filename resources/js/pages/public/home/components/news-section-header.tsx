import { Link, router, usePage } from '@inertiajs/react';
import type { PublicCategorySummary } from '@/types';
import { Check, Filter, Newspaper, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { readCsrfToken } from '@/pages/public/profile/lib/profile-utils';

interface NewsSectionHeaderProps {
    selectedCategory: string | null;
    categories: Record<string, PublicCategorySummary>;
    search?: string | null;
    isFollowingCategory?: boolean;
    categoryFollowersCount?: number;
}

export function NewsSectionHeader({
    selectedCategory,
    categories,
    search,
    isFollowingCategory = false,
    categoryFollowersCount = 0,
}: NewsSectionHeaderProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    const [isFollowing, setIsFollowing] = useState(isFollowingCategory);
    const [followersCount, setFollowersCount] = useState(categoryFollowersCount);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleFollow = async () => {
        if (!selectedCategory) return;

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
            const res = await fetch(`/categoria/${selectedCategory}/seguir`, {
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
                return;
            }

            const data = (await res.json()) as { following: boolean; followers_count: number };
            setIsFollowing(data.following);
            setFollowersCount(data.followers_count);
        } catch {
            setIsFollowing(prevFollowing);
            setFollowersCount(prevCount);
        } finally {
            setIsSubmitting(false);
        }
    };

    let title = 'Últimas Noticias';
    let subtitle = 'Novedades y notas destacadas';

    if (search) {
        title = `Resultados para: "${search}"`;
        subtitle = 'Artículos que coinciden con tu búsqueda';
    } else if (selectedCategory) {
        title = `Categoría: ${categories[selectedCategory]?.label ?? selectedCategory}`;
        subtitle = 'Explora las publicaciones de esta sección';
    }

    return (
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center dark:border-neutral-800">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
                    <Newspaper className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                            {title}
                        </h2>
                        {selectedCategory && followersCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100/80 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-400">
                                <Users className="h-3 w-3" />
                                {followersCount} {followersCount === 1 ? 'seguidor' : 'seguidores'}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
                {selectedCategory && (
                    <button
                        type="button"
                        onClick={handleToggleFollow}
                        disabled={isSubmitting}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                            isFollowing
                                ? 'border border-neutral-300 bg-white text-neutral-800 hover:border-rose-300 hover:text-rose-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:text-rose-400'
                                : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-rose-500/20'
                        }`}
                    >
                        {isFollowing ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Siguiendo</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Seguir categoría</span>
                            </>
                        )}
                    </button>
                )}

                {(selectedCategory || search) && (
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-rose-600 transition-colors hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                        <Filter className="h-3.5 w-3.5" />
                        <span>
                            {search
                                ? 'Limpiar'
                                : 'Ver todas'}
                        </span>
                    </Link>
                )}
            </div>
        </div>
    );
}
