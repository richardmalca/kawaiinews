import { Link } from '@inertiajs/react';
import { Newspaper, Settings, Sparkles, UserCheck, UserPlus, Users } from 'lucide-react';
import type { PublicUserProfile } from '@/types';

interface ProfileHeaderProps {
    profile: PublicUserProfile;
    followersCount: number;
    isFollowing: boolean;
    isSubmitting: boolean;
    onToggleFollow: () => void;
}

export function ProfileHeader({
    profile,
    followersCount,
    isFollowing,
    isSubmitting,
    onToggleFollow,
}: ProfileHeaderProps) {
    return (
        <div className="mb-10 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:shadow-none">
            {profile.banner ? (
                <div className="relative h-44 w-full overflow-hidden bg-neutral-900 sm:h-56 md:h-64">
                    <img
                        src={profile.banner}
                        alt="Banner de perfil"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
            ) : (
                <div className="h-44 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 sm:h-56 md:h-64" />
            )}

            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                <div className="-mt-14 sm:-mt-16 mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
                        <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-rose-500/10 text-4xl font-black text-rose-600 shadow-xl dark:border-neutral-900 dark:bg-rose-500/20 dark:text-rose-400">
                            {profile.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={profile.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                profile.name.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="space-y-1 pb-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                                    {profile.name}
                                </h1>
                                {profile.is_author && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>Redactor Oficial</span>
                                    </span>
                                )}
                            </div>
                            <p className="font-mono text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                @{profile.username}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0 pb-1">
                        {profile.is_self ? (
                            <Link
                                href="/perfil/mi-cuenta/ajustes"
                                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/90 bg-neutral-100/80 px-4 py-2.5 text-xs font-semibold text-neutral-800 shadow-xs transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-750"
                            >
                                <Settings className="h-3.5 w-3.5 text-neutral-500" />
                                <span>Ajustes de cuenta</span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={onToggleFollow}
                                disabled={isSubmitting}
                                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-xs transition-colors ${
                                    isFollowing
                                        ? 'border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-rose-50 hover:text-rose-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                                        : 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600'
                                }`}
                            >
                                {isFollowing ? (
                                    <>
                                        <UserCheck className="h-4 w-4 text-rose-500" />
                                        <span>Siguiendo</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        <span>Seguir</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 border-t border-neutral-100 pt-5 text-xs dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm font-black text-neutral-950 dark:text-white">
                            {followersCount}
                        </span>
                        <span>seguidores</span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <span className="text-sm font-black text-neutral-950 dark:text-white">
                            {profile.following_count}
                        </span>
                        <span>siguiendo</span>
                    </div>

                    {profile.is_author && typeof profile.published_articles_count === 'number' && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <Newspaper className="h-4 w-4 text-rose-500" />
                            <span className="text-sm font-black text-neutral-950 dark:text-white">
                                {profile.published_articles_count}
                            </span>
                            <span>noticias publicadas</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
