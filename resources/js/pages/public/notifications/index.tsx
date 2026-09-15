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

            <div className="w-full space-y-5">
                {/* Cabecera / Banner Superior con mayor distribución y diseño kawaii */}
                <div className="overflow-hidden rounded-3xl border border-rose-500/15 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent p-4 sm:p-6 dark:border-rose-500/20 dark:from-rose-500/15 dark:via-neutral-900">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-md shadow-rose-500/25">
                                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl lg:text-3xl dark:text-white">
                                        Centro de Notificaciones
                                    </h1>
                                    {unread > 0 ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            {unread} sin leer
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            <Check className="h-3 w-3" />
                                            Todo al día
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
                                    Revisa tus reacciones, guardados, respuestas, menciones y noticias de la comunidad.
                                </p>
                            </div>
                        </div>

                        {/* Botones de acción globales */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {unread > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-rose-600 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-rose-400 transition-colors"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    <span>Marcar leídas</span>
                                </button>
                            )}
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleDeleteAll}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60 transition-colors"
                                    title="Borrar todo el historial"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Limpiar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Barra de Filtros / Pestañas Scrollable horizontal en móvil */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
                    {FILTERS.map((f) => {
                        const active = currentFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => handleFilterChange(f.id)}
                                className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                    active
                                        ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-950'
                                        : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-100 hover:text-neutral-950 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white'
                                }`}
                            >
                                <span>{f.label}</span>
                                {f.id === 'no_leidas' && unread > 0 && (
                                    <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white leading-none">
                                        {unread}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Listado en Rejilla Responsiva (1 columna en móvil, 2 columnas en pantallas medianas y grandes para aprovechar el ancho) */}
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:gap-3">
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
                                    className={`group relative flex items-start gap-3 rounded-2xl border p-3 sm:p-3.5 cursor-pointer transition-all duration-150 ${
                                        isUnread
                                            ? 'border-rose-300/80 bg-rose-50/40 shadow-xs hover:border-rose-400 hover:bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20 dark:hover:bg-rose-950/30'
                                            : 'border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/70 dark:border-neutral-800/80 dark:bg-neutral-900/80 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50'
                                    }`}
                                >
                                    {/* Punto indicador de no leído */}
                                    {isUnread && (
                                        <span
                                            className="absolute top-3 right-3 h-2 w-2 rounded-full bg-rose-500 shadow-xs"
                                            title="No leída"
                                        />
                                    )}

                                    {/* Avatar con Insignia de tipo */}
                                    <div className="relative shrink-0 mt-0.5">
                                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-bold text-xs sm:text-sm">
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
                                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-neutral-900 shadow-xs ring-1 ring-neutral-200 dark:ring-neutral-800">
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

                                    {/* Contenido descriptivo compacto */}
                                    <div className="min-w-0 flex-1 pr-5">
                                        <p className="text-xs sm:text-[13px] text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2">
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
                                                        <span> guardó tu noticia </span>
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
                                                            publicó una noticia:{' '}
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
                                                            Nueva noticia en{' '}
                                                            <span className="font-bold text-neutral-950 dark:text-white">
                                                                #{item.data.reason_label}
                                                            </span>
                                                            :{' '}
                                                        </span>
                                                    ) : (
                                                        <span>Nueva noticia:{' '}</span>
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
                                            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 italic line-clamp-1">
                                                "{item.data.reply_preview || item.data.comment_preview}"
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] sm:text-[11px] text-neutral-400 dark:text-neutral-500">
                                            <span>{item.created_at}</span>
                                            {isUnread && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                        Sin leer
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botón eliminar individual */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(item.id, e)}
                                        className="sm:opacity-0 group-hover:opacity-100 p-1 sm:p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shrink-0"
                                        title="Eliminar notificación"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-neutral-200/80 bg-white/95 p-8 sm:p-12 text-center text-sm text-neutral-400 dark:border-neutral-800/80 dark:bg-neutral-900/90 dark:text-neutral-500">
                        <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                        <p className="font-medium text-neutral-700 dark:text-neutral-300">
                            No tienes notificaciones en este filtro
                        </p>
                        <p className="text-xs mt-1 text-neutral-400 dark:text-neutral-500">
                            Las interacciones de otros usuarios o novedades aparecerán aquí.
                        </p>
                    </div>
                )}

                {/* Paginación */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-3">
                        {notifications.prev_page_url && (
                            <Link
                                href={notifications.prev_page_url}
                                className="rounded-xl border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 transition-colors"
                            >
                                Anterior
                            </Link>
                        )}
                        <span className="text-xs text-neutral-500 font-medium">
                            Página {notifications.current_page} de {notifications.last_page}
                        </span>
                        {notifications.next_page_url && (
                            <Link
                                href={notifications.next_page_url}
                                className="rounded-xl border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 transition-colors"
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
