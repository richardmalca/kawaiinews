import { Link } from '@inertiajs/react';
import { ArrowUpRight, Bookmark, MessageSquare, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { PublicUserProfile } from '@/types';
import { CategoryBadge } from '@/components/public/category-badge';
import { ProfileSharedArticles } from './profile-shared-articles';

interface ProfileTabsSectionProps {
    profile: PublicUserProfile;
}

export function ProfileTabsSection({ profile }: ProfileTabsSectionProps) {
    const isSelf = profile.is_self;
    const favorites = profile.favorites ?? [];
    const shares = profile.shares ?? [];
    const comments = profile.comments ?? [];
    const sharesVisible = profile.shares_visible;

    const [activeTab, setActiveTab] = useState<'shares' | 'favorites' | 'comments'>(
        sharesVisible ? 'shares' : isSelf ? 'favorites' : comments.length > 0 ? 'comments' : 'shares',
    );

    if (!sharesVisible && !isSelf && comments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200/80 pb-3 dark:border-neutral-800/80">
                {sharesVisible && (
                    <button
                        type="button"
                        onClick={() => setActiveTab('shares')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'shares'
                                ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Compartidas ({shares.length})</span>
                    </button>
                )}

                {isSelf && (
                    <button
                        type="button"
                        onClick={() => setActiveTab('favorites')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'favorites'
                                ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>Guardadas ({favorites.length})</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setActiveTab('comments')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        activeTab === 'comments'
                            ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'
                            : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                    }`}
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Comentarios ({comments.length})</span>
                </button>
            </div>

            {activeTab === 'shares' && sharesVisible && (
                <ProfileSharedArticles shares={shares} />
            )}

            {activeTab === 'favorites' && isSelf && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3 dark:border-neutral-800/80">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <Bookmark className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg dark:text-white">
                                    Mis noticias guardadas
                                </h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Artículos que agregaste a favoritos para leer luego
                                </p>
                            </div>
                        </div>

                        {favorites.length > 0 && (
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {favorites.length} {favorites.length === 1 ? 'noticia' : 'noticias'}
                            </span>
                        )}
                    </div>

                    {favorites.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {favorites.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/noticias/${item.slug}`}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:shadow-none dark:hover:border-neutral-700/80 dark:hover:bg-neutral-900/80"
                                >
                                    <div className="relative h-44 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                                        {item.featured_image ? (
                                            <img
                                                src={item.featured_image}
                                                alt={item.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-br from-amber-500/20 to-neutral-800" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                        {item.category && (
                                            <div className="absolute top-3 left-3">
                                                <CategoryBadge category={item.category} />
                                            </div>
                                        )}

                                        <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col justify-between p-5">
                                        <div className="space-y-2">
                                            <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 transition-colors group-hover:text-amber-600 dark:text-neutral-100 dark:group-hover:text-amber-400">
                                                {item.title}
                                            </h3>

                                            {item.excerpt && (
                                                <p className="line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                                                    {item.excerpt}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-neutral-200 p-12 text-center text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                            <Bookmark className="mx-auto mb-3 h-8 w-8 text-neutral-400 dark:text-neutral-600" />
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                No tienes noticias guardadas todavía
                            </p>
                            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                                Haz clic en el botón de guardar en cualquier noticia para verla aquí.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'comments' && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3 dark:border-neutral-800/80">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg dark:text-white">
                                    {isSelf ? 'Mis comentarios recientes' : `Comentarios de ${profile.name}`}
                                </h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Opiniones y participaciones en noticias y artículos
                                </p>
                            </div>
                        </div>

                        {comments.length > 0 && (
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
                            </span>
                        )}
                    </div>

                    {comments.length > 0 ? (
                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <Link
                                    key={comment.id}
                                    href={`/noticias/${comment.article.slug}#comentario-${comment.id}`}
                                    className="group block rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:hover:border-neutral-700/80 dark:hover:bg-neutral-900/80"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                                En {comment.article.title}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-neutral-400 shrink-0">
                                            {comment.created_at}
                                        </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                                        {comment.is_spoiler ? (
                                            <span className="italic text-neutral-400 dark:text-neutral-500">
                                                [Comentario marcado como spoiler] {comment.body}
                                            </span>
                                        ) : (
                                            comment.body
                                        )}
                                    </p>

                                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 group-hover:text-rose-600 dark:text-neutral-400 dark:group-hover:text-rose-400 transition-colors">
                                        <span>Ir al comentario</span>
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-neutral-200 p-12 text-center text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-neutral-400 dark:text-neutral-600" />
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                No hay comentarios publicados todavía
                            </p>
                            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                                Comenta en las noticias para que aparezcan en tu perfil.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
