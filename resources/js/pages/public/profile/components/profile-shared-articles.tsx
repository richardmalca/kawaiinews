import { Link } from '@inertiajs/react';
import { ArrowUpRight, Clock, Share2 } from 'lucide-react';
import type { PublicUserProfile } from '@/types';
import { CategoryBadge } from '@/components/public/category-badge';

interface ProfileSharedArticlesProps {
    shares: PublicUserProfile['shares'];
}

export function ProfileSharedArticles({ shares }: ProfileSharedArticlesProps) {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3 dark:border-neutral-800/80">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                        <Share2 className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg dark:text-white">
                            Noticias compartidas
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Artículos recomendados y difundidos por este usuario
                        </p>
                    </div>
                </div>

                {shares && shares.length > 0 && (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {shares.length} {shares.length === 1 ? 'noticia' : 'noticias'}
                    </span>
                )}
            </div>

            {shares && shares.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {shares.map((share) => (
                        <Link
                            key={share.id}
                            href={`/noticias/${share.slug}`}
                            className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:shadow-none dark:hover:border-neutral-700/80 dark:hover:bg-neutral-900/80"
                        >
                            <div className="relative h-44 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                                {share.featured_image ? (
                                    <img
                                        src={share.featured_image}
                                        alt={share.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-rose-500/20 to-neutral-800" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                {share.category && (
                                    <div className="absolute top-3 left-3">
                                        <CategoryBadge category={share.category} />
                                    </div>
                                )}

                                <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col justify-between p-5">
                                <div className="space-y-2">
                                    <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 transition-colors group-hover:text-rose-600 dark:text-neutral-100 dark:group-hover:text-rose-400">
                                        {share.title}
                                    </h3>

                                    {share.excerpt && (
                                        <p className="line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                                            {share.excerpt}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 dark:border-neutral-800/80 dark:text-neutral-400">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Clock className="h-3 w-3 text-rose-500" />
                                        <span>Compartido {share.shared_at || 'recientemente'}</span>
                                    </span>

                                    {share.shared_date && (
                                        <span className="text-neutral-400 dark:text-neutral-500">
                                            {share.shared_date}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-neutral-200 p-12 text-center text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <Share2 className="mx-auto mb-3 h-8 w-8 text-neutral-400 dark:text-neutral-600" />
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        No hay noticias compartidas todavía
                    </p>
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                        Cuando este usuario comparta noticias desde los botones sociales, se mostrarán aquí.
                    </p>
                </div>
            )}
        </div>
    );
}
