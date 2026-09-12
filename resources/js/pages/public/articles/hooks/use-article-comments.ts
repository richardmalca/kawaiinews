import { useCallback, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import type { PublicComment, PublicCommentsResponse } from '@/types';
import { openChooseUsernameModal } from '@/lib/username-rules';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

interface UseArticleCommentsProps {
    articleSlug: string;
    onRequireAuth?: () => void;
}

export function useArticleComments({ articleSlug, onRequireAuth }: UseArticleCommentsProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);
    const hasUsername = Boolean(auth.user?.username);

    const [comments, setComments] = useState<PublicComment[]>([]);
    const [totalComments, setTotalComments] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [replyingTo, setReplyingTo] = useState<PublicComment | null>(null);

    const fetchComments = useCallback(
        async (targetPage = 1, append = false): Promise<PublicComment[]> => {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            try {
                const response = await fetch(`/noticias/${articleSlug}/comentarios?page=${targetPage}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    return [];
                }

                const json = (await response.json()) as PublicCommentsResponse;
                if (append) {
                    setComments((prev) => [...prev, ...json.data]);
                } else {
                    setComments(json.data);
                }

                setTotalComments(json.meta.total);
                setPage(json.meta.current_page);
                setHasMore(json.meta.current_page < json.meta.last_page);
                return json.data;
            } catch {
                return [];
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [articleSlug],
    );

    useEffect(() => {
        fetchComments(1, false);
    }, [fetchComments]);

    const loadMore = useCallback(async () => {
        if (!hasMore || isLoadingMore) {
            return [];
        }
        return await fetchComments(page + 1, true);
    }, [fetchComments, hasMore, isLoadingMore, page]);

    // Manejo automático de navegación directa a un comentario (ej: #comentario-123 de una notificación)
    useEffect(() => {
        const scrollToAndHighlight = (commentId: string): boolean => {
            const el = document.getElementById(`comentario-${commentId}`);
            if (el) {
                // Obtenemos la altura real del header fijo (navbar + categorías)
                const header = document.querySelector('header');
                const headerHeight = header ? header.getBoundingClientRect().height : 120;
                
                // Calculamos la posición exacta con un margen extra de 24px para que se aprecie holgadamente
                const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight - 24;

                window.scrollTo({
                    top: Math.max(0, offsetPosition),
                    behavior: 'smooth',
                });

                el.classList.add(
                    'ring-2',
                    'ring-rose-500',
                    'ring-offset-2',
                    'bg-rose-50/70',
                    'dark:bg-rose-950/40',
                    'dark:ring-offset-neutral-950',
                );
                setTimeout(() => {
                    el.classList.remove(
                        'ring-2',
                        'ring-rose-500',
                        'ring-offset-2',
                        'bg-rose-50/70',
                        'dark:bg-rose-950/40',
                        'dark:ring-offset-neutral-950',
                    );
                }, 3500);
                return true;
            }
            return false;
        };

        const checkAndNavigateToHash = async () => {
            const hash = window.location.hash;
            if (!hash || !hash.startsWith('#comentario-')) {
                return;
            }

            const targetId = hash.replace('#comentario-', '');
            if (!targetId) {
                return;
            }

            // Si ya está en el DOM, hacer scroll directo
            if (scrollToAndHighlight(targetId)) {
                return;
            }

            // Si aún no está cargado y hay más comentarios por cargar, cargar recursivamente hasta encontrarlo o agotar
            let currentPage = page;
            let currentHasMore = hasMore;
            let found = false;

            while (currentHasMore && !found) {
                const nextPage = currentPage + 1;
                const newComments = await fetchComments(nextPage, true);
                currentPage = nextPage;

                // Verificar si el comentario o alguna de sus respuestas está en el lote recién obtenido
                const inNewBatch = newComments.some(
                    (c) =>
                        String(c.id) === targetId ||
                        c.replies?.some((r) => String(r.id) === targetId),
                );

                if (inNewBatch) {
                    found = true;
                    // Pequeño timeout para dar tiempo a React a renderizar el nuevo lote en el DOM
                    setTimeout(() => {
                        scrollToAndHighlight(targetId);
                    }, 150);
                    break;
                }

                // Si no se obtuvo nada o ya no hay más páginas, detener el bucle
                if (newComments.length === 0) {
                    break;
                }
            }
        };

        // Escuchar cambios de hash (cuando se hace clic en una notificación estando ya en la página)
        window.addEventListener('hashchange', checkAndNavigateToHash);

        // Si la página recién cargó los primeros comentarios, verificar el hash inicial
        if (!isLoading && comments.length > 0) {
            checkAndNavigateToHash();
        }

        return () => {
            window.removeEventListener('hashchange', checkAndNavigateToHash);
        };
    }, [comments, fetchComments, hasMore, isLoading, page]);

    const checkAuthAndUsername = useCallback((): boolean => {
        if (!isAuthenticated) {
            if (onRequireAuth) {
                onRequireAuth();
            }
            return false;
        }

        if (!hasUsername) {
            openChooseUsernameModal();
            return false;
        }

        return true;
    }, [isAuthenticated, hasUsername, onRequireAuth]);

    const addComment = useCallback(
        async ({
            body,
            replyToCommentId,
            isSpoiler = false,
        }: {
            body: string;
            replyToCommentId?: number | null;
            isSpoiler?: boolean;
        }): Promise<boolean> => {
            if (!checkAuthAndUsername()) {
                return false;
            }

            const trimmed = body.trim();
            if (!trimmed) {
                return false;
            }

            setIsSubmitting(true);

            const postPromise = async () => {
                const response = await fetch(`/noticias/${articleSlug}/comentarios`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': readCsrfToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        body: trimmed,
                        reply_to_comment_id: replyToCommentId ?? undefined,
                        is_spoiler: isSpoiler,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Error al publicar comentario');
                }

                return (await response.json()) as PublicComment;
            };

            try {
                const promise = postPromise();
                toast.promise(promise, {
                    loading: 'Publicando comentario...',
                    success: '¡Comentario publicado!',
                    error: 'No se pudo publicar el comentario',
                });

                const created = await promise;

                if (created.is_pending) {
                    toast.info('Tu comentario ha sido enviado y se encuentra en revisión.');
                    setReplyingTo(null);
                    return true;
                }

                if (replyToCommentId) {
                    setComments((prev) =>
                        prev.map((c) => {
                            const isDirectRoot = c.id === replyToCommentId;
                            const isChildTarget = c.replies?.some((r) => r.id === replyToCommentId);

                            if (isDirectRoot || isChildTarget) {
                                const currentReplies = c.replies ?? [];
                                return {
                                    ...c,
                                    replies: [...currentReplies, created],
                                };
                            }
                            return c;
                        }),
                    );
                } else {
                    setComments((prev) => [created, ...prev]);
                    setTotalComments((t) => t + 1);
                }

                setReplyingTo(null);
                return true;
            } catch {
                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [articleSlug, checkAuthAndUsername],
    );

    const updateComment = useCallback(
        async (
            commentId: number,
            { body, isSpoiler }: { body: string; isSpoiler?: boolean },
        ): Promise<boolean> => {
            if (!checkAuthAndUsername()) {
                return false;
            }

            const updatePromise = async () => {
                const response = await fetch(`/comentarios/${commentId}`, {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': readCsrfToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        body: body.trim(),
                        ...(isSpoiler !== undefined ? { is_spoiler: isSpoiler } : {}),
                    }),
                });

                if (!response.ok) {
                    throw new Error('Error al actualizar');
                }

                return (await response.json()) as PublicComment;
            };

            try {
                const promise = updatePromise();
                toast.promise(promise, {
                    loading: 'Guardando cambios...',
                    success: 'Comentario actualizado',
                    error: 'No se pudo actualizar el comentario',
                });

                const updated = await promise;

                setComments((prev) =>
                    prev.map((root) => {
                        if (root.id === commentId) {
                            return {
                                ...root,
                                body: updated.body,
                                is_spoiler: updated.is_spoiler,
                                is_edited: true,
                            };
                        }
                        if (root.replies && root.replies.some((r) => r.id === commentId)) {
                            return {
                                ...root,
                                replies: root.replies.map((r) =>
                                    r.id === commentId
                                        ? {
                                              ...r,
                                              body: updated.body,
                                              is_spoiler: updated.is_spoiler,
                                              is_edited: true,
                                          }
                                        : r,
                                ),
                            };
                        }
                        return root;
                    }),
                );

                return true;
            } catch {
                return false;
            }
        },
        [checkAuthAndUsername],
    );

    const deleteComment = useCallback(
        async (commentId: number, isRoot = false): Promise<boolean> => {
            if (!checkAuthAndUsername()) {
                return false;
            }

            const deletePromise = async () => {
                const response = await fetch(`/comentarios/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': readCsrfToken(),
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar');
                }

                return true;
            };

            try {
                const promise = deletePromise();
                toast.promise(promise, {
                    loading: 'Eliminando comentario...',
                    success: 'Comentario eliminado',
                    error: 'No se pudo eliminar el comentario',
                });

                await promise;

                if (isRoot) {
                    setComments((prev) => prev.filter((c) => c.id !== commentId));
                    setTotalComments((t) => Math.max(0, t - 1));
                } else {
                    setComments((prev) =>
                        prev.map((root) => ({
                            ...root,
                            replies: root.replies?.filter((r) => r.id !== commentId) ?? [],
                        })),
                    );
                }

                return true;
            } catch {
                return false;
            }
        },
        [checkAuthAndUsername],
    );

    const toggleLikeComment = useCallback(
        async (commentId: number): Promise<void> => {
            if (!checkAuthAndUsername()) {
                return;
            }

            const applyLikeUpdate = (
                updater: (hasLiked: boolean, count: number) => { hasLiked: boolean; count: number },
            ) => {
                setComments((prev) =>
                    prev.map((root) => {
                        if (root.id === commentId) {
                            const next = updater(root.has_liked, root.likes_count);
                            return { ...root, has_liked: next.hasLiked, likes_count: next.count };
                        }
                        if (root.replies && root.replies.some((r) => r.id === commentId)) {
                            return {
                                ...root,
                                replies: root.replies.map((r) => {
                                    if (r.id === commentId) {
                                        const next = updater(r.has_liked, r.likes_count);
                                        return { ...r, has_liked: next.hasLiked, likes_count: next.count };
                                    }
                                    return r;
                                }),
                            };
                        }
                        return root;
                    }),
                );
            };

            applyLikeUpdate((hasLiked, count) => ({
                hasLiked: !hasLiked,
                count: hasLiked ? Math.max(0, count - 1) : count + 1,
            }));

            try {
                const response = await fetch(`/comentarios/${commentId}/me-gusta`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': readCsrfToken(),
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    applyLikeUpdate((hasLiked, count) => ({
                        hasLiked: !hasLiked,
                        count: hasLiked ? Math.max(0, count - 1) : count + 1,
                    }));
                    return;
                }

                const data = (await response.json()) as { liked: boolean; total_likers: number };
                applyLikeUpdate(() => ({
                    hasLiked: data.liked,
                    count: data.total_likers,
                }));
            } catch {
                applyLikeUpdate((hasLiked, count) => ({
                    hasLiked: !hasLiked,
                    count: hasLiked ? Math.max(0, count - 1) : count + 1,
                }));
            }
        },
        [checkAuthAndUsername],
    );

    return {
        comments,
        totalComments,
        isLoading,
        isLoadingMore,
        isSubmitting,
        hasMore,
        replyingTo,
        setReplyingTo,
        loadMore,
        addComment,
        updateComment,
        deleteComment,
        toggleLikeComment,
        checkAuthAndUsername,
    };
}
