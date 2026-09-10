import { useCallback, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import type { PublicUserProfile } from '@/types';
import { readCsrfToken } from '../lib/profile-utils';

interface UseProfileFollowProps {
    profile: PublicUserProfile;
}

export function useProfileFollow({ profile }: UseProfileFollowProps) {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    const [isFollowing, setIsFollowing] = useState(profile.is_following);
    const [followersCount, setFollowersCount] = useState(profile.followers_count);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleFollow = useCallback(async () => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (isSubmitting || profile.is_self) {
            return;
        }

        setIsSubmitting(true);
        const previousFollowing = isFollowing;
        const previousCount = followersCount;

        setIsFollowing(!previousFollowing);
        setFollowersCount(previousFollowing ? Math.max(0, previousCount - 1) : previousCount + 1);

        try {
            const response = await fetch(`/perfil/${profile.username}/seguir`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCsrfToken(),
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                setIsFollowing(previousFollowing);
                setFollowersCount(previousCount);
                toast.error('No se pudo actualizar el seguimiento');
                return;
            }

            const data = (await response.json()) as { following: boolean };
            setIsFollowing(data.following);
            if (data.following) {
                toast.success(`Ahora sigues a ${profile.name}`);
            } else {
                toast(`Dejaste de seguir a ${profile.name}`);
            }
        } catch {
            setIsFollowing(previousFollowing);
            setFollowersCount(previousCount);
            toast.error('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    }, [isAuthenticated, isSubmitting, profile.is_self, profile.username, profile.name, isFollowing, followersCount]);

    return {
        isFollowing,
        followersCount,
        isSubmitting,
        toggleFollow,
    };
}
