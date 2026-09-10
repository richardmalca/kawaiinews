import { Bell, Check, CheckCheck, MessageSquare, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { readCsrfToken } from '@/pages/public/profile/lib/profile-utils';

export interface AppNotificationItem {
    id: string;
    data: {
        type?: string;
        replier_name?: string;
        replier_username?: string;
        replier_avatar?: string | null;
        article_title?: string;
        reply_preview?: string;
        follower_name?: string;
        follower_username?: string;
        follower_avatar?: string | null;
        url?: string;
    };
    read_at: string | null;
    created_at: string;
}

export function NotificationBell() {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch('/notificaciones', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unread_count ?? 0);
                setNotifications(data.notifications ?? []);
            }
        } catch {
            // Ignorar errores en fetch silencioso
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

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

            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
            );
        } catch {
            // Continuar
        }

        if (url) {
            setIsOpen(false);
            const currentUrl = window.location.pathname + window.location.search;
            const targetUrl = url.split('#')[0];
            const hash = url.includes('#') ? url.split('#')[1] : '';

            if (targetUrl === currentUrl || targetUrl === window.location.pathname) {
                if (hash) {
                    window.location.hash = hash;
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                }
            } else {
                router.visit(url);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsLoading(true);

        const markPromise = async () => {
            const res = await fetch('/notificaciones/leer-todas', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Error al actualizar');
            }

            return res;
        };

        try {
            await toast.promise(markPromise(), {
                loading: 'Marcando todas como leídas...',
                success: 'Todas las notificaciones marcadas como leídas',
                error: 'No se pudieron actualizar las notificaciones',
            });

            setUnreadCount(0);
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
            );
        } catch {
            // Error capturado por toast.promise
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) fetchNotifications();
                }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                    isOpen
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-400'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white'
                }`}
                aria-label="Notificaciones"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50 duration-200">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md z-50 animate-in fade-in-0 zoom-in-95 duration-150 dark:border-neutral-800/90 dark:bg-neutral-950/95">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 px-1 dark:border-neutral-800/60">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                Notificaciones
                            </span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                    {unreadCount} nuevas
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 transition-colors"
                            >
                                <CheckCheck className="h-3 w-3" />
                                <span>Marcar todas</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900/60 py-1">
                        {notifications.length > 0 ? (
                            notifications.map((item) => {
                                const isUnread = !item.read_at;
                                const isReply = item.data.type === 'comment_reply';
                                const isFollow = item.data.type === 'user_follow';

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleMarkAsRead(item.id, item.data.url)}
                                        className={`group flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                                            isUnread
                                                ? 'bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:hover:bg-rose-500/15'
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                                        }`}
                                    >
                                        <div className="relative shrink-0 mt-0.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-bold text-xs">
                                                {(item.data.replier_avatar || item.data.follower_avatar) ? (
                                                    <img
                                                        src={(item.data.replier_avatar || item.data.follower_avatar) as string}
                                                        alt="Avatar"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    (item.data.replier_name || item.data.follower_name || 'K').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-neutral-950 shadow-xs">
                                                {isReply && (
                                                    <MessageSquare className="h-2.5 w-2.5 text-rose-500" />
                                                )}
                                                {isFollow && (
                                                    <UserPlus className="h-2.5 w-2.5 text-sky-500" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-snug">
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
                                                {isFollow && (
                                                    <>
                                                        <span className="font-bold text-neutral-950 dark:text-white">
                                                            {item.data.follower_name}
                                                        </span>{' '}
                                                        comenzó a seguirte.
                                                    </>
                                                )}
                                                {!isReply && !isFollow && (
                                                    <span>Nueva notificación</span>
                                                )}
                                            </p>

                                            {item.data.reply_preview && (
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic line-clamp-1">
                                                    "{item.data.reply_preview}"
                                                </p>
                                            )}

                                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                                {item.created_at}
                                            </p>
                                        </div>

                                        {isUnread && (
                                            <span className="h-2 w-2 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                                <Bell className="mx-auto mb-2 h-6 w-6 text-neutral-300 dark:text-neutral-700" />
                                No tienes notificaciones pendientes
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}