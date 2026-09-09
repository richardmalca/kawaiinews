import { useCallback, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PublicArticle } from '@/types';
import { openChooseUsernameModal } from '@/lib/username-rules';

function readCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

interface UseArticleInteractionsProps {
    article: PublicArticle;
    onRequireAuth?: () => void;
}

export function useArticleInteractions({ article, onRequireAuth }: UseArticleInteractionsProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);
    const hasUsername = Boolean(auth.user?.username);

    const [liked, setLiked] = useState<boolean>(Boolean(article.has_liked));
    const [likersCount, setLikersCount] = useState<number>(article.likers_count ?? 0);
    const [favorited, setFavorited] = useState<boolean>(Boolean(article.has_favorited));
    const [sharesCount, setSharesCount] = useState<number>(article.shares_count ?? 0);
    const [isLiking, setIsLiking] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);

    const toggleLike = useCallback(async () => {
        if (!isAuthenticated) {
            if (onRequireAuth) {
                onRequireAuth();
                return;
            }
            router.visit('/login');
            return;
        }

        if (!hasUsername) {
            openChooseUsernameModal();
            return;
        }

        if (isLiking) {
            return;
        }

        setIsLiking(true);
        const previousLiked = liked;
        const previousCount = likersCount;

        setLiked(!previousLiked);
        setLikersCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

        try {
            const response = await fetch(`/noticias/${article.slug}/me-gusta`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                setLiked(previousLiked);
                setLikersCount(previousCount);
                return;
            }

            const data = (await response.json()) as { liked: boolean; total_likers: number };
            setLiked(data.liked);
            setLikersCount(data.total_likers);
        } catch {
            setLiked(previousLiked);
            setLikersCount(previousCount);
        } finally {
            setIsLiking(false);
        }
    }, [isAuthenticated, hasUsername, onRequireAuth, isLiking, liked, likersCount, article.slug]);

    const toggleFavorite = useCallback(async () => {
        if (!isAuthenticated) {
            if (onRequireAuth) {
                onRequireAuth();
                return;
            }
            router.visit('/login');
            return;
        }

        if (!hasUsername) {
            openChooseUsernameModal();
            return;
        }

        if (isFavoriting) {
            return;
        }

        setIsFavoriting(true);
        const previousFavorited = favorited;
        setFavorited(!previousFavorited);

        try {
            const response = await fetch(`/noticias/${article.slug}/favorito`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                setFavorited(previousFavorited);
                return;
            }

            const data = (await response.json()) as { favorited: boolean };
            setFavorited(data.favorited);
        } catch {
            setFavorited(previousFavorited);
        } finally {
            setIsFavoriting(false);
        }
    }, [isAuthenticated, hasUsername, onRequireAuth, isFavoriting, favorited, article.slug]);

    const recordShare = useCallback(
        async (channel: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'link') => {
            setSharesCount((prev) => prev + 1);

            try {
                const response = await fetch(`/noticias/${article.slug}/compartir`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': readCsrfToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ channel }),
                });

                if (response.ok) {
                    const data = (await response.json()) as { shared: boolean; total_shares: number };
                    if (typeof data.total_shares === 'number') {
                        setSharesCount(data.total_shares);
                    }
                }
            } catch {
            }
        },
        [article.slug],
    );

    return {
        liked,
        likersCount,
        favorited,
        sharesCount,
        isLiking,
        isFavoriting,
        toggleLike,
        toggleFavorite,
        recordShare,
    };
}
