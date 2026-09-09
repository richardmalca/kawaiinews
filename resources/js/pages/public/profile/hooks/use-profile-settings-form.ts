import { useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import type { User } from '@/types';
import { validateImageFile } from '../lib/profile-utils';

interface UseProfileSettingsFormProps {
    user: User;
}

export function useProfileSettingsForm({ user }: UseProfileSettingsFormProps) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.custom_avatar || user.avatar || null,
    );
    const [bannerPreview, setBannerPreview] = useState<string | null>(
        user.banner || null,
    );
    const [fileError, setFileError] = useState<string | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<{
        name: string;
        username: string;
        show_shares_on_profile: boolean;
        avatar_source: 'google' | 'custom';
        custom_avatar: File | null;
        banner: File | string | null;
    }>({
        name: user.name ?? '',
        username: user.username ?? '',
        show_shares_on_profile: Boolean(user.show_shares_on_profile),
        avatar_source: (user.avatar_source as 'google' | 'custom') || (user.custom_avatar ? 'custom' : 'google'),
        custom_avatar: null,
        banner: null,
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file, 'avatar');
        if (!validation.isValid) {
            setFileError(validation.error);
            return;
        }

        setFileError(null);
        form.setData('custom_avatar', file);
        form.setData('avatar_source', 'custom');

        const reader = new FileReader();
        reader.onload = (event) => {
            setAvatarPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file, 'banner');
        if (!validation.isValid) {
            setFileError(validation.error);
            return;
        }

        setFileError(null);
        form.setData('banner', file);

        const reader = new FileReader();
        reader.onload = (event) => {
            setBannerPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const selectPresetBanner = (url: string) => {
        setFileError(null);
        setBannerPreview(url);
        form.setData('banner', url);
    };

    const setAvatarSource = (source: 'google' | 'custom') => {
        form.setData('avatar_source', source);
    };

    const activeAvatar =
        form.data.avatar_source === 'google' && user.avatar
            ? user.avatar
            : avatarPreview || user.avatar;

    return {
        form,
        avatarPreview,
        bannerPreview,
        activeAvatar,
        fileError,
        avatarInputRef,
        bannerInputRef,
        handleAvatarChange,
        handleBannerChange,
        selectPresetBanner,
        setAvatarSource,
    };
}
