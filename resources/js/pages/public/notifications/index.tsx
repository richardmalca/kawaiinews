import { SeoHead } from '@/components/common/seo-head';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary } from '@/types';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    AtSign,
    Bell,
    Bookmark,
    Check,
    CheckCheck,
    Heart,
    MessageSquare,
    Newspaper,
    Share2,
    Trash2,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { readCsrfToken } from '@/pages/public/profile/lib/profile-utils';
import type { AppNotificationItem } from '@/components/public/notification-bell';

interface NotificationsPageProps {
    notifications: {
        data: AppNotificationItem[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    unreadCount: number;
    currentFilter: string;
    categories: Record<string, PublicCategorySummary>;
}

const FILTERS = [
    { id: 'todas', label: 'Todas' },
    { id: 'no_leidas', label: 'No leídas' },
    { id: 'reacciones', label: 'Reacciones' },
    { id: 'guardados', label: 'Guardados & Shares' },
    { id: 'comentarios', label: 'Comentarios & Menciones' },
    { id: 'seguidores', label: 'Seguidores' },
    { id: 'noticias', label: 'Nuevas Noticias' },
];

export default function NotificationsPage({
    notifications,
    unreadCount,
    currentFilter,
    categories,
}: NotificationsPageProps) {
    const [items, setItems] = useState<AppNotificationItem[]>(notifications.data);
    const [unread, setUnread] = useState(unreadCount);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleFilterChange = (filterId: string) => {
        router.visit(`/notificaciones?filtro=${filterId}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleMarkAsRead = async (id: string, url?: string) => {
        try {
            await fetch(`/notificaciones/${id}/leida`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            setUnread((prev) => Math.max(0, prev - 1));
            setItems((prev) =>
                prev.map((n) =>
                    n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
                ),
            );
        } catch {
            // Ignorar
        }

        if (url) {
            router.visit(url);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsActionLoading(true);
        try {
            const res = await fetch('/notificaciones/leer-todas', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                setUnread(0);
                setItems((prev) =>
                    prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
                );
                toast.success('Todas las notificaciones marcadas como leídas');
            }
        } catch {
            toast.error('No se pudieron marcar las notificaciones');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/notificaciones/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                setItems((prev) => prev.filter((n) => n.id !== id));
                toast.success('Notificación eliminada');
            }
        } catch {
            toast.error('No se pudo eliminar la notificación');
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('¿Estás seguro de eliminar todo el historial de notificaciones?')) return;

        setIsActionLoading(true);
        try {
            const res = await fetch('/notificaciones', {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (res.ok) {
                setItems([]);
                setUnread(0);
                toast.success('Historial de notificaciones borrado');
            }
        } catch {
            toast.error('No se pudo borrar el historial');
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <PublicLayout categories={categories}>
            <SeoHead
                title="Notificaciones - KawaiiNews"
                description="Centro de notificaciones e interacciones de tu cuenta en KawaiiNews."
            />

            {/* Breadcrumb / Regresar */}
            <div className="mb-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a la portada</span>
                </Link>
            </div>

            {/* Encabezado limpio y estándar del sitio */}
            <div className="mb-6 flex flex-col gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Bell className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl dark:text-white">
                                Notificaciones
                            </h1>
                            {unread > 0 && (
                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                    {unread} sin leer
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Interacciones, comentarios, reacciones y novedades de tu cuenta
                        </p>
                    </div>
                </div>

                {/* Acciones de gestión */}
                <div className="flex items-center gap-2">
                    {unread > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-rose-600 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                            <CheckCheck className="h-3.5 w-3.5 text-neutral-400" />
                            <span>Marcar todas como leídas</span>
                        </button>
                    )}
                    {items.length > 0 && (
                        <button
                            type="button"
                            onClick={handleDeleteAll}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:text-neutral-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Borrar todo el historial"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Limpiar historial</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Pestañas de filtrado (estilo pestañas de perfil / noticias) */}
            <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-100 dark:border-neutral-800/60">
                {FILTERS.map((f) => {
                    const active = currentFilter === f.id;
                    return (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => handleFilterChange(f.id)}
                            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                active
                                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                            }`}
                        >
                            <span>{f.label}</span>
                            {f.id === 'no_leidas' && unread > 0 && (
                                <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                    {unread}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Listado de notificaciones */}
            {items.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800/80 dark:bg-neutral-900/60 divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {items.map((item) => {
                        const isUnread = !item.read_at;
                        const isReply = item.data.type === 'comment_reply';
                        const isMention = item.data.type === 'comment_mention';
                        const isFollow = item.data.type === 'user_follow';
                        const isNewArticle = item.data.type === 'new_article';
                        const isLiked = item.data.type === 'article_liked';
                        const isSaved = item.data.type === 'article_saved';
                        const isShared = item.data.type === 'article_shared';
                        const isArticleCommented = item.data.type === 'article_commented';

                        const avatarSrc = (
                            item.data.commenter_avatar ||
                            item.data.saver_avatar ||
                            item.data.sharer_avatar ||
                            item.data.liker_avatar ||
                            item.data.mentioner_avatar ||
                            item.data.replier_avatar ||
                            item.data.follower_avatar ||
                            item.data.author_avatar
                        ) as string | undefined;

                        const avatarInitial = (
                            item.data.commenter_name ||
                            item.data.saver_name ||
                            item.data.sharer_name ||
                            item.data.liker_name ||
                            item.data.mentioner_name ||
                            item.data.replier_name ||
                            item.data.follower_name ||
                            item.data.author_name ||
                            'K'
                        ).charAt(0).toUpperCase();

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleMarkAsRead(item.id, item.data.url)}
                                className={`group flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 transition-colors cursor-pointer ${
                                    isUnread
                                        ? 'bg-rose-50/40 hover:bg-rose-50/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/30'
                                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                                }`}
                            >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    {/* Indicador de no leído */}
                                    <div className="pt-2 shrink-0">
                                        <div
                                            className={`h-2 w-2 rounded-full ${
                                                isUnread ? 'bg-rose-600' : 'bg-transparent'
                                            }`}
                                        />
                                    </div>

                                    {/* Avatar / Icono */}
                                    <div className="relative shrink-0 mt-0.5">
                                        {isNewArticle && item.data.featured_image ? (
                                            <div className="h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                                <img
                                                    src={item.data.featured_image}
                                                    alt="Portada"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : avatarSrc ? (
                                            <img
                                                src={avatarSrc}
                                                alt="Avatar"
                                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
                                            />
                                        ) : (
                                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                {avatarInitial}
                                            </div>
                                        )}

                                        {/* Insignia pequeña en la esquina */}
                                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                                            {isLiked && <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />}
                                            {isSaved && <Bookmark className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />}
                                            {isShared && <Share2 className="h-2.5 w-2.5 text-blue-500" />}
                                            {(isReply || isArticleCommented) && <MessageSquare className="h-2.5 w-2.5 text-rose-500" />}
                                            {isMention && <AtSign className="h-2.5 w-2.5 text-purple-500" />}
                                            {isFollow && <UserPlus className="h-2.5 w-2.5 text-sky-500" />}
                                            {isNewArticle && <Newspaper className="h-2.5 w-2.5 text-rose-500" />}
                                        </div>
                                    </div>

                                    {/* Texto y detalles */}
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-snug">
                                            {isReply && (
                                                <>
                                                    <span className="font-semibold text-neutral-950 dark:text-white">
                                                        {item.data.replier_name}
                                                    </span>{' '}
                                                    respondió a tu comentario en{' '}
                                                    <span className="font-semibold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400">
                                                        {item.data.article_title}
                                                    </span>
                                                </>
                                            )}
                                            {isMention && (
                                                <>
                                                    <span className="font-semibold text-neutral-950 dark:text-white">
                                                        {item.data.mentioner_name}
                                                    </span>{' '}
                                                    te mencionó en un comentario en{' '}
                                                    <span className="font-semibold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400">
                                                        {item.data.article_title}
                                                    </span>
                                                </>
                                            )}
                                            {isFollow && (
                                                <>
                                                    <span className="font-semibold text-neutral-950 dark:text-white">
                                                        {item.data.follower_name}
                                                    </span>{' '}
                                                    comenzó a seguirte
                                                </>
                                            )}
                                            {isLiked && (
                                                <>
                                                    <span className="font-semibold text-neutral-950 dark:text-white">
                                                        {item.data.liker_name}
                                                    </span>
                                                    {(item.data.total_reactions ?? 1) > 1 ? (
                                                        <span>
                                                            {' '}y a otras{' '}
                                                            <span className="font-semibold text-neutral-950 dark:text-white">
                                                                {(item.data.total_reactions ?? 1) - 1}
                                                            </span>{' '}
                                                            personas les gusta tu noticia{' '}
                                                        </span>
                                                    ) : (
                                                        <span> le dio me gusta a tu noticia </span>
                                                    )}
                                                    <span className="font-semibold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400">
                                                        {item.data.article_title}
                                                    </span>
                                                </>
                                            )}
                                            {isSaved && (
                                                <>
                                                    <span className="font-semibold text-neutral-950 dark:text-white">
                                                        {item.data.saver_name}
                                                    </span>
                                                    {(item.data.total_saves ?? 1) > 1 ? (
                                                        <span>
                                                            {' '}y otras{' '}
                                                            <span className="font-semibold text-neutral-950 dark:text-white">
                                                                {(item.data.total_saves ?? 1) - 1}
                                                            </span>{' '}
                                                            personas guardaron tu noticia{' '}
                                                        </span>
                                                    ) : (
                                                        <span> guardó en favoritos tu noticia </span>
                                                    )}
                                                    <span className="font-semibold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400">
                                                        {item.data.article_title}
                                                    </span>
                                                </>
                                            )}
                                            {isShared && (
                                                <>
                                                    <span className="font-semibold text-neutral-950 dark:text-white">
                                                        {item.data.sharer_name}
                                                    </span>
                                                    {(item.data.total_shares ?? 1) > 1 ? (
                                                        <span>
                                                            {' '}y otras{' '}
                                                            <span className="font-semibold text-neutral-950 dark:text-white">
                                                                {(item.data.total_shares ?? 1) - 1}
                                                            </span>{' '}
                                                            personas compartieron tu noticia{' '}
                                                        </span>
                                                    ) : (
                                                        <span> compartió tu noticia </span>
                                                    )}
                                                    <span className="font-semibold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400">
                                                        {item.data.article_title}
                                                    </span>
                                                </>
                                            )}
                                            {isArticleCommented && (
                                                <>
                                                    <span className="font-semibold text-neutral-950 dark:text-white">
                                                        {item.data.commenter_name}
                                                    </span>
                                                    {(item.data.total_comments ?? 1) > 1 ? (
                                                        <span>
                                                            {' '}y otras{' '}
                                                            <span className="font-semibold text-neutral-950 dark:text-white">
                                                                {(item.data.total_comments ?? 1) - 1}
                                                            </span>{' '}
                                                            personas comentaron tu noticia{' '}
                                                        </span>
                                                    ) : (
                                                        <span> comentó en tu noticia </span>
                                                    )}
                                                    <span className="font-semibold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400">
                                                        {item.data.article_title}
                                                    </span>
                                                </>
                                            )}
                                            {isNewArticle && (
                                                <>
                                                    {item.data.reason === 'author' && item.data.author_name ? (
                                                        <span>
                                                            <span className="font-semibold text-neutral-950 dark:text-white">
                                                                {item.data.author_name}
                                                            </span>{' '}
                                                            publicó una noticia:{' '}
                                                        </span>
                                                    ) : item.data.reason === 'category' ? (
                                                        <span>
                                                            Nueva noticia en{' '}
                                                            <span className="font-semibold text-neutral-950 dark:text-white">
                                                                {item.data.category || item.data.reason_label}
                                                            </span>
                                                            :{' '}
                                                        </span>
                                                    ) : item.data.reason === 'tag' ? (
                                                        <span>
                                                            Nueva noticia en{' '}
                                                            <span className="font-semibold text-neutral-950 dark:text-white">
                                                                #{item.data.reason_label}
                                                            </span>
                                                            :{' '}
                                                        </span>
                                                    ) : (
                                                        <span>Nueva noticia:{' '}</span>
                                                    )}
                                                    <span className="font-semibold text-neutral-900 hover:text-rose-600 dark:text-neutral-100 dark:hover:text-rose-400">
                                                        {item.data.article_title}
                                                    </span>
                                                </>
                                            )}
                                            {!isReply && !isMention && !isFollow && !isNewArticle && !isLiked && !isSaved && !isShared && (
                                                <span>Nueva interacción</span>
                                            )}
                                        </p>

                                        {(item.data.reply_preview || item.data.comment_preview) && (
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                                "{item.data.reply_preview || item.data.comment_preview}"
                                            </p>
                                        )}

                                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                            {item.created_at}
                                        </p>
                                    </div>
                                </div>

                                {/* Botón eliminar fila */}
                                <button
                                    type="button"
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    title="Eliminar notificación"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-neutral-200/80 bg-white py-16 text-center text-neutral-400 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-500">
                    <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        No tienes notificaciones
                    </p>
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                        Cuando alguien reaccione a tus noticias o interactúe contigo, aparecerá aquí.
                    </p>
                </div>
            )}

            {/* Paginación limpia estándar */}
            {notifications.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-6 dark:border-neutral-800">
                    <div>
                        {notifications.prev_page_url ? (
                            <Link
                                href={notifications.prev_page_url}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>Anterior</span>
                            </Link>
                        ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-600">Anterior</span>
                        )}
                    </div>

                    <span className="text-xs text-neutral-500">
                        Página {notifications.current_page} de {notifications.last_page}
                    </span>

                    <div>
                        {notifications.next_page_url ? (
                            <Link
                                href={notifications.next_page_url}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                            >
                                <span>Siguiente</span>
                                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                            </Link>
                        ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-600">Siguiente</span>
                        )}
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
