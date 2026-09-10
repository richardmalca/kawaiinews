import { useCallback, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
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
        async (targetPage = 1, append = false) => {
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
                    return;
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
            } catch {
                // Ignore network errors
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

    const loadMore = useCallback(() => {
        if (!hasMore || isLoadingMore) {
            return;
        }
        fetchComments(page + 1, true);
    }, [fetchComments, hasMore, isLoadingMore, page]);

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
            try {
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
                    return false;
                }

                const created = (await response.json()) as PublicComment;

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

            try {
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
                    return false;
                }

                const updated = (await response.json()) as PublicComment;

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

            try {
                const response = await fetch(`/comentarios/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': readCsrfToken(),
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    return false;
                }

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
