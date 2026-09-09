import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary, PublicUserProfile } from '@/types';
import { ArrowLeft, Check, Newspaper, Share2, Sparkles, UserCheck, UserPlus, Users } from 'lucide-react';

interface ProfileShowProps {
    profile: PublicUserProfile;
    categories?: Record<string, PublicCategorySummary>;
}

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function ProfileShow({ profile, categories }: ProfileShowProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    const [isFollowing, setIsFollowing] = useState(profile.is_following);
    const [followersCount, setFollowersCount] = useState(profile.followers_count);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleFollow = async () => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (isSubmitting || profile.is_self) {
            return;
        }

        setIsSubmitting(true);
        const previousFollowing = isFollowing;
        const previousCount = followersCount;

        setIsFollowing(!previousFollowing);
        setFollowersCount(previousFollowing ? Math.max(0, previousCount - 1) : previousCount + 1);

        try {
            const response = await fetch(`/perfil/${profile.username}/seguir`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                setIsFollowing(previousFollowing);
                setFollowersCount(previousCount);
                return;
            }

            const data = (await response.json()) as { following: boolean };
            setIsFollowing(data.following);
        } catch {
            setIsFollowing(previousFollowing);
            setFollowersCount(previousCount);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PublicLayout categories={categories}>
            <Head title={`@${profile.username} - KawaiiNews`} />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a la portada</span>
                </Link>
            </div>

            <div className="mb-10 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:shadow-none">
                {profile.banner ? (
                    <div className="relative h-32 w-full overflow-hidden bg-neutral-900 sm:h-44 md:h-52">
                        <img
                            src={profile.banner}
                            alt="Banner de perfil"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>
                ) : (
                    <div className="h-32 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 sm:h-40" />
                )}

                <div className="relative px-6 pb-6 sm:px-8">
                    <div className="-mt-14 mb-4 flex flex-wrap items-end justify-between gap-4">
                        <div className="flex items-end gap-4">
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-rose-500/10 text-3xl font-black text-rose-600 shadow-md dark:border-neutral-900 dark:bg-rose-500/20 dark:text-rose-400">
                                {profile.avatar ? (
                                    <img
                                        src={profile.avatar}
                                        alt={profile.name}
                                        className="h-full w-full rounded-xl object-cover"
                                    />
                                ) : (
                                    profile.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            <div className="mb-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl dark:text-white">
                                        {profile.name}
                                    </h1>
                                    {profile.is_author && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                            <Sparkles className="h-3 w-3" />
                                            Redactor
                                        </span>
                                    )}
                                </div>
                                <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                                    @{profile.username}
                                </p>
                            </div>
                        </div>

                        <div>
                            {profile.is_self ? (
                                <Link
                                    href="/perfil/mi-cuenta/ajustes"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100/80 px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                >
                                    Editar ajustes de perfil
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleToggleFollow}
                                    disabled={isSubmitting}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
                                        isFollowing
                                            ? 'border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-rose-50 hover:text-rose-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                                            : 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600'
                                    }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserCheck className="h-3.5 w-3.5 text-rose-500" />
                                            <span>Siguiendo</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-3.5 w-3.5" />
                                            <span>Seguir</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 border-t border-neutral-100 pt-4 text-xs dark:border-neutral-800">
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                            <Users className="h-3.5 w-3.5 text-neutral-400" />
                            <span className="font-bold text-neutral-900 dark:text-white">
                                {followersCount}
                            </span>
                            <span>seguidores</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                            <span className="font-bold text-neutral-900 dark:text-white">
                                {profile.following_count}
                            </span>
                            <span>siguiendo</span>
                        </div>

                        {profile.is_author && typeof profile.published_articles_count === 'number' && (
                            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Newspaper className="h-3.5 w-3.5 text-rose-500" />
                                <span className="font-bold text-neutral-900 dark:text-white">
                                    {profile.published_articles_count}
                                </span>
                                <span>noticias publicadas</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {profile.shares_visible && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500">
                            <Share2 className="h-3.5 w-3.5" />
                        </div>
                        <h2 className="text-base font-bold tracking-tight text-neutral-950 dark:text-white">
                            Noticias compartidas recientemente
                        </h2>
                    </div>

                    {profile.shares && profile.shares.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {profile.shares.map((share) => (
                                <Link
                                    key={share.id}
                                    href={`/noticias/${share.slug}`}
                                    className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:shadow-none dark:hover:border-neutral-700"
                                >
                                    {share.featured_image && (
                                        <img
                                            src={share.featured_image}
                                            alt={share.title}
                                            className="h-16 w-16 shrink-0 rounded-xl object-cover transition-transform group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    )}
                                    <h3 className="line-clamp-2 text-xs font-semibold text-neutral-900 transition-colors group-hover:text-rose-600 dark:text-neutral-100 dark:group-hover:text-rose-400">
                                        {share.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 text-center text-xs text-neutral-500 dark:border-neutral-800/80 dark:bg-neutral-900/40">
                            No hay noticias compartidas para mostrar.
                        </div>
                    )}
                </div>
            )}
        </PublicLayout>
    );
}
