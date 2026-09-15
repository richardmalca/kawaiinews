import {
    AtSign,
    Bell,
    BellOff,
    Check,
    CheckCheck,
    Heart,
    MessageSquare,
    Newspaper,
    UserPlus,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { readCsrfToken } from '@/pages/public/profile/lib/profile-utils';
import {
    getNotificationPermission,
    isBrowserNotificationSupported,
    playNotificationSound,
    requestBrowserNotificationPermission,
    showBrowserNotification,
} from '@/lib/notification-sound';

export interface AppNotificationItem {
    id: string;
    data: {
        type?: string;
        liker_id?: number;
        liker_name?: string;
        liker_username?: string;
        liker_avatar?: string | null;
        reaction?: string;
        total_reactions?: number;
        replier_name?: string;
        replier_username?: string;
        replier_avatar?: string | null;
        article_id?: number;
        article_title?: string;
        article_slug?: string;
        article_excerpt?: string;
        featured_image?: string | null;
        category?: string;
        author_id?: number;
        author_name?: string;
        author_username?: string;
        author_avatar?: string | null;
        reason?: 'author' | 'category' | 'tag' | string;
        reason_label?: string | null;
        reply_preview?: string;
        mentioner_id?: number;
        mentioner_name?: string;
        mentioner_username?: string;
        mentioner_avatar?: string | null;
        comment_preview?: string;
        follower_name?: string;
        follower_username?: string;
        follower_avatar?: string | null;
        url?: string;
    };
    read_at: string | null;
    created_at: string;
}

export function NotificationBell() {
    const { auth, siteLogoUrl } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('kawaii_notification_sound') !== 'false';
        }
        return true;
    });
    const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

    const dropdownRef = useRef<HTMLDivElement>(null);
    const prevNotificationIdsRef = useRef<Set<string>>(new Set());
    const isInitialFetchRef = useRef(true);
    const isFetchingRef = useRef(false);
    const soundEnabledRef = useRef(soundEnabled);

    useEffect(() => {
        soundEnabledRef.current = soundEnabled;
    }, [soundEnabled]);

    // Actualizar estado de permiso al montar
    useEffect(() => {
        if (isBrowserNotificationSupported()) {
            setBrowserPermission(getNotificationPermission());
        }
    }, []);

    const toggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('kawaii_notification_sound', String(next));
        }
        if (next) {
            playNotificationSound();
            toast.success('Sonido de notificaciones activado', { id: 'sound-toggle' });
        } else {
            toast('Sonido de notificaciones silenciado', { id: 'sound-toggle' });
        }
    };

    const handleEnableBrowserNotifications = async () => {
        if (!isBrowserNotificationSupported()) {
            toast.error('Tu navegador no admite notificaciones de escritorio/móvil.');
            return;
        }

        const granted = await requestBrowserNotificationPermission();
        setBrowserPermission(getNotificationPermission());

        if (granted) {
            toast.success('¡Notificaciones de escritorio/móvil activadas!', { id: 'browser-notif-perm' });
            showBrowserNotification('KawaiiNews', {
                body: 'Las notificaciones en tu dispositivo están activadas.',
                icon: siteLogoUrl || '/android-chrome-192x192.png',
            });
        } else {
            toast.error('Permiso de notificaciones denegado en tu navegador.', { id: 'browser-notif-perm' });
        }
    };

    const fetchNotifications = async () => {
        if (!isAuthenticated || isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            const res = await fetch('/notificaciones', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (res.ok) {
                const data = await res.json();
                const fetchedNotifications: AppNotificationItem[] = data.notifications ?? [];
                const newUnreadCount = data.unread_count ?? 0;

                // Detectar si hay nuevas notificaciones que no estaban en la carga previa
                if (!isInitialFetchRef.current) {
                    const newItems = fetchedNotifications.filter(
                        (n) => !n.read_at && !prevNotificationIdsRef.current.has(n.id),
                    );

                    if (newItems.length > 0) {
                        // 1. Sonido en pantalla si está habilitado
                        if (soundEnabledRef.current) {
                            playNotificationSound();
                        }

                        // 2. Notificación en pantalla y sistema operativo (PC / Móvil)
                        const latest = newItems[0];
                        let title = 'Nueva notificación';
                        let body = 'Tienes una nueva interacción en KawaiiNews';

                        if (latest.data.type === 'comment_reply') {
                            title = `${latest.data.replier_name ?? 'Alguien'} respondió a tu comentario`;
                            body = latest.data.reply_preview || 'Revisa la respuesta en el artículo';
                        } else if (latest.data.type === 'comment_mention') {
                            title = `${latest.data.mentioner_name ?? 'Alguien'} te mencionó`;
                            body = latest.data.comment_preview || 'Te etiquetaron en un comentario';
                        } else if (latest.data.type === 'user_follow') {
                            title = 'Nuevo seguidor';
                            body = `${latest.data.follower_name ?? 'Un usuario'} ha comenzado a seguirte`;
                        } else if (latest.data.type === 'new_article') {
                            title = 'Nueva noticia publicada';
                            body = latest.data.article_title || 'Hay un nuevo artículo disponible';
                        } else if (latest.data.type === 'article_liked') {
                            const othersCount = (latest.data.total_reactions ?? 1) - 1;
                            title = '¡Reacción en tu noticia!';
                            body = othersCount > 0
                                ? `A ${latest.data.liker_name ?? 'Alguien'} y a otras ${othersCount} personas les gusta tu noticia`
                                : `A ${latest.data.liker_name ?? 'Alguien'} le gusta tu noticia "${latest.data.article_title ?? ''}"`;
                        }

                        toast.info(title, {
                            id: `notif-${latest.id}`,
                            description: body,
                            action: latest.data.url
                                ? {
                                      label: 'Ver',
                                      onClick: () => handleMarkAsRead(latest.id, latest.data.url),
                                  }
                                : undefined,
                        });

                        showBrowserNotification(title, {
                            body,
                            icon:
                                latest.data.mentioner_avatar ||
                                latest.data.replier_avatar ||
                                latest.data.follower_avatar ||
                                siteLogoUrl ||
                                '/android-chrome-192x192.png',
                            url: latest.data.url,
                            tag: `notif-${latest.id}`,
                        });
                    }
                } else {
                    isInitialFetchRef.current = false;
                }

                prevNotificationIdsRef.current = new Set(
                    fetchedNotifications.map((n) => n.id),
                );
                setUnreadCount(newUnreadCount);
                setNotifications(fetchedNotifications);
            }
        } catch {
            // Ignorar errores en fetch silencioso
        } finally {
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 25000);
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

                        <div className="flex items-center gap-2">
                            {/* Toggle Sonido */}
                            <button
                                type="button"
                                onClick={toggleSound}
                                className={`rounded-lg p-1 transition-colors ${
                                    soundEnabled
                                        ? 'text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-rose-400 dark:hover:bg-neutral-900'
                                        : 'text-neutral-400 line-through hover:text-neutral-600 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-900'
                                }`}
                                title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
                                aria-label="Sonido de notificaciones"
                            >
                                {soundEnabled ? (
                                    <Volume2 className="h-3.5 w-3.5" />
                                ) : (
                                    <VolumeX className="h-3.5 w-3.5" />
                                )}
                            </button>

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
                    </div>

                    {/* Banner para activar notificaciones de escritorio / móvil si no están concedidas */}
                    {isBrowserNotificationSupported() && browserPermission === 'default' && (
                        <div className="mt-2 mb-1.5 flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 p-2.5 text-xs dark:from-rose-500/15 dark:to-amber-500/15">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-rose-500 shrink-0" />
                                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                                    ¿Recibir alertas en tu PC o móvil?
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleEnableBrowserNotifications}
                                className="shrink-0 rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
                            >
                                Activar
                            </button>
                        </div>
                    )}

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900/60 py-1">
                        {notifications.length > 0 ? (
                            notifications.map((item) => {
                                const isUnread = !item.read_at;
                                const isReply = item.data.type === 'comment_reply';
                                const isMention = item.data.type === 'comment_mention';
                                const isFollow = item.data.type === 'user_follow';
                                const isNewArticle = item.data.type === 'new_article';
                                const isLiked = item.data.type === 'article_liked';

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
                                                {isNewArticle && item.data.featured_image ? (
                                                    <img
                                                        src={item.data.featured_image}
                                                        alt="Portada"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (item.data.liker_avatar || item.data.mentioner_avatar || item.data.replier_avatar || item.data.follower_avatar || item.data.author_avatar) ? (
                                                    <img
                                                        src={(item.data.liker_avatar || item.data.mentioner_avatar || item.data.replier_avatar || item.data.follower_avatar || item.data.author_avatar) as string}
                                                        alt="Avatar"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    (item.data.liker_name || item.data.mentioner_name || item.data.replier_name || item.data.follower_name || item.data.author_name || 'K').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-neutral-950 shadow-xs">
                                                {isLiked && (
                                                    <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
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
                                                {!isReply && !isMention && !isFollow && !isNewArticle && !isLiked && (
                                                    <span>Nueva notificación</span>
                                                )}
                                            </p>

                                            {(item.data.reply_preview || item.data.comment_preview) && (
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic line-clamp-1">
                                                    "{item.data.reply_preview || item.data.comment_preview}"
                                                </p>
                                            )}

                                            {isNewArticle && item.data.article_excerpt && (
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                                    {item.data.article_excerpt}
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