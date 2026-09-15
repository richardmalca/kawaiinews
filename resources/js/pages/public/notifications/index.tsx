import { SeoHead } from '@/components/common/seo-head';
import PublicLayout from '@/layouts/public-layout';
import type { PublicCategorySummary } from '@/types';
import { Link, router } from '@inertiajs/react';
import {
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
                title="Centro de Notificaciones"
                description="Revisa tus interacciones, menciones, reacciones y novedades en KawaiiNews."
            />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Cabecera */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                                    Centro de Notificaciones
                                </h1>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {unread > 0 ? `Tienes ${unread} interacciones sin leer` : 'Todo al día por aquí'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                disabled={isActionLoading}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-rose-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-rose-400 transition-colors"
                            >
                                <CheckCheck className="h-4 w-4" />
                                <span>Marcar todas como leídas</span>
                            </button>
                        )}
                        {items.length > 0 && (
                            <button
                                type="button"
                                onClick={handleDeleteAll}
                                disabled={isActionLoading}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                                title="Borrar todo el historial"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Limpiar historial</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Pestañas / Filtros */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {FILTERS.map((f) => {
                        const active = currentFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => handleFilterChange(f.id)}
                                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                                    active
                                        ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-950'
                                        : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-100 hover:text-neutral-950 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white'
                                }`}
                            >
                                {f.label}
                                {f.id === 'no_leidas' && unread > 0 && (
                                    <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                        {unread}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Listado de Notificaciones */}
                <div className="rounded-3xl border border-neutral-200/80 bg-white/95 p-2 sm:p-4 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/90">
                    {items.length > 0 ? (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                            {items.map((item) => {
                                const isUnread = !item.read_at;
                                const isReply = item.data.type === 'comment_reply';
                                const isMention = item.data.type === 'comment_mention';
                                const isFollow = item.data.type === 'user_follow';
                                const isNewArticle = item.data.type === 'new_article';
                                const isLiked = item.data.type === 'article_liked';
                                const isSaved = item.data.type === 'article_saved';
                                const isShared = item.data.type === 'article_shared';

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleMarkAsRead(item.id, item.data.url)}
                                        className={`group flex items-start justify-between gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors ${
                                            isUnread
                                                ? 'bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:hover:bg-rose-500/15'
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                            {/* Avatar con Insignia */}
                                            <div className="relative shrink-0 mt-0.5">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-bold text-sm">
                                                    {isNewArticle && item.data.featured_image ? (
                                                        <img
                                                            src={item.data.featured_image}
                                                            alt="Portada"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (item.data.saver_avatar || item.data.sharer_avatar || item.data.liker_avatar || item.data.mentioner_avatar || item.data.replier_avatar || item.data.follower_avatar || item.data.author_avatar) ? (
                                                        <img
                                                            src={(item.data.saver_avatar || item.data.sharer_avatar || item.data.liker_avatar || item.data.mentioner_avatar || item.data.replier_avatar || item.data.follower_avatar || item.data.author_avatar) as string}
                                                            alt="Avatar"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        (item.data.saver_name || item.data.sharer_name || item.data.liker_name || item.data.mentioner_name || item.data.replier_name || item.data.follower_name || item.data.author_name || 'K').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-neutral-900 shadow-xs ring-2 ring-white dark:ring-neutral-900">
                                                    {isLiked && (
                                                        <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                                                    )}
                                                    {isSaved && (
                                                        <Bookmark className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                                    )}
                                                    {isShared && (
                                                        <Share2 className="h-2.5 w-2.5 text-blue-500" />
                                                    )}
                                                    {isReply && (
                                                        <MessageSquare className="h-2.5 w-2.5 text-rose-500" />
                                                    )}
                                                    {isMention && (
                                                        <AtSign className="h-2.5 w-2.5 text-purple-500" />
                                                    )}
                                                    {isFollow && (
                                                        <UserPlus className="h-2.5 w-2.5 text-sky-500" />
                                                    )}
                                                    {isNewArticle && (
                                                        <Newspaper className="h-2.5 w-2.5 text-rose-500" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contenido descriptivo */}
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-snug">
                                                    {isReply && (
                                                        <>
                                                            <span className="font-bold text-neutral-950 dark:text-white">
                                                                {item.data.replier_name}
                                                            </span>{' '}
                                                            respondió a tu comentario en{' '}
                                                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                                {item.data.article_title}
                                                            </span>
                                                        </>
                                                    )}
                                                    {isMention && (
                                                        <>
                                                            <span className="font-bold text-neutral-950 dark:text-white">
                                                                {item.data.mentioner_name}
                                                            </span>{' '}
                                                            te mencionó en un comentario en{' '}
                                                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                                {item.data.article_title}
                                                            </span>
                                                        </>
                                                    )}
                                                    {isFollow && (
                                                        <>
                                                            <span className="font-bold text-neutral-950 dark:text-white">
                                                                {item.data.follower_name}
                                                            </span>{' '}
                                                            comenzó a seguirte.
                                                        </>
                                                    )}
                                                    {isLiked && (
                                                        <>
                                                            <span className="font-bold text-neutral-950 dark:text-white">
                                                                {item.data.liker_name}
                                                            </span>
                                                            {(item.data.total_reactions ?? 1) > 1 ? (
                                                                <span>
                                                                    {' '}y a otras{' '}
                                                                    <span className="font-bold text-neutral-950 dark:text-white">
                                                                        {(item.data.total_reactions ?? 1) - 1}
                                                                    </span>{' '}
                                                                    personas les gusta tu noticia{' '}
                                                                </span>
                                                            ) : (
                                                                <span> le gusta tu noticia </span>
                                                            )}
                                                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                                {item.data.article_title}
                                                            </span>
                                                        </>
                                                    )}
                                                    {isSaved && (
                                                        <>
                                                            <span className="font-bold text-neutral-950 dark:text-white">
                                                                {item.data.saver_name}
                                                            </span>
                                                            {(item.data.total_saves ?? 1) > 1 ? (
                                                                <span>
                                                                    {' '}y otras{' '}
                                                                    <span className="font-bold text-neutral-950 dark:text-white">
                                                                        {(item.data.total_saves ?? 1) - 1}
                                                                    </span>{' '}
                                                                    personas guardaron tu noticia{' '}
                                                                </span>
                                                            ) : (
                                                                <span> guardó en favoritos tu noticia </span>
                                                            )}
                                                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                                {item.data.article_title}
                                                            </span>
                                                        </>
                                                    )}
                                                    {isShared && (
                                                        <>
                                                            <span className="font-bold text-neutral-950 dark:text-white">
                                                                {item.data.sharer_name}
                                                            </span>
                                                            {(item.data.total_shares ?? 1) > 1 ? (
                                                                <span>
                                                                    {' '}y otras{' '}
                                                                    <span className="font-bold text-neutral-950 dark:text-white">
                                                                        {(item.data.total_shares ?? 1) - 1}
                                                                    </span>{' '}
                                                                    personas compartieron tu noticia{' '}
                                                                </span>
                                                            ) : (
                                                                <span> compartió tu noticia </span>
                                                            )}
                                                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                                {item.data.article_title}
                                                            </span>
                                                        </>
                                                    )}
                                                    {isNewArticle && (
                                                        <>
                                                            {item.data.reason === 'author' && item.data.author_name ? (
                                                                <span>
                                                                    <span className="font-bold text-neutral-950 dark:text-white">
                                                                        {item.data.author_name}
                                                                    </span>{' '}
                                                                    publicó una nueva noticia:{' '}
                                                                </span>
                                                            ) : item.data.reason === 'category' ? (
                                                                <span>
                                                                    Nueva noticia en{' '}
                                                                    <span className="font-bold text-neutral-950 dark:text-white">
                                                                        {item.data.category || item.data.reason_label}
                                                                    </span>
                                                                    :{' '}
                                                                </span>
                                                            ) : item.data.reason === 'tag' ? (
                                                                <span>
                                                                    Nueva noticia en tag{' '}
                                                                    <span className="font-bold text-neutral-950 dark:text-white">
                                                                        #{item.data.reason_label}
                                                                    </span>
                                                                    :{' '}
                                                                </span>
                                                            ) : (
                                                                <span>Nueva noticia publicada:{' '}</span>
                                                            )}
                                                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                                {item.data.article_title}
                                                            </span>
                                                        </>
                                                    )}
                                                    {!isReply && !isMention && !isFollow && !isNewArticle && !isLiked && !isSaved && !isShared && (
                                                        <span>Nueva interacción</span>
                                                    )}
                                                </p>

                                                {(item.data.reply_preview || item.data.comment_preview) && (
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 italic line-clamp-2">
                                                        "{item.data.reply_preview || item.data.comment_preview}"
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                                                    <span>{item.created_at}</span>
                                                    {isUnread && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-bold text-rose-600 dark:text-rose-400">
                                                                Sin leer
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón eliminar individual */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(item.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
                                            title="Eliminar notificación"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-sm text-neutral-400 dark:text-neutral-500">
                            <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                            <p className="font-medium text-neutral-600 dark:text-neutral-300">
                                No hay notificaciones en este filtro
                            </p>
                            <p className="text-xs mt-1">
                                Las interacciones en tus noticias o comentarios aparecerán aquí.
                            </p>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {notifications.prev_page_url && (
                            <Link
                                href={notifications.prev_page_url}
                                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                            >
                                Anterior
                            </Link>
                        )}
                        <span className="text-xs text-neutral-500">
                            Página {notifications.current_page} de {notifications.last_page}
                        </span>
                        {notifications.next_page_url && (
                            <Link
                                href={notifications.next_page_url}
                                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                            >
                                Siguiente
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
