import { useState } from 'react';

export interface UseShareOptions {
    title: string;
    text?: string | null;
    url?: string;
    category?: string;
    onShare?: (channel: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'native' | 'link') => void;
}

export function useShare({
    title,
    text,
    url,
    category,
    onShare,
}: UseShareOptions) {
    const [copied, setCopied] = useState(false);

    const shareUrl =
        url || (typeof window !== 'undefined' ? window.location.href : '');

    const getCategoryEmoji = (cat?: string) => {
        const key = cat?.toLowerCase() || '';
        if (key.includes('anime')) return '🌸';
        if (key.includes('manga')) return '📖';
        if (key.includes('gaming') || key.includes('juego')) return '🎮';
        if (key.includes('tecnolog') || key.includes('tech')) return '⚡';
        if (key.includes('cultura')) return '🍱';
        return '✨';
    };

    const emoji = getCategoryEmoji(category);
    const summary = text ? text.slice(0, 140) : '';

    const whatsappMessage = `${emoji} *${title}*${summary ? `\n\n${summary}` : ''}\n\n👉 Léelo completo en KawaiiNews:\n${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

    const twitterHashtags = category
        ? `${category.replace(/\s+/g, '')},KawaiiNews,Anime`
        : 'KawaiiNews,Anime,Gaming';
    const twitterText = `${emoji} ${title}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(twitterHashtags)}`;

    const telegramText = `${emoji} **${title}**${summary ? `\n\n${summary}` : ''}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramText)}`;

    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    const canNativeShare =
        typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    const handleNativeShare = async () => {
        if (!canNativeShare) {
            await handleCopyLink();
            return;
        }

        try {
            await navigator.share({
                title,
                text: `${emoji} ${title} - KawaiiNews`,
                url: shareUrl,
            });
            onShare?.('native');
        } catch {
            // User dismissed native sheet or unsupported
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            onShare?.('link');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return {
        copied,
        shareUrl,
        whatsappUrl,
        twitterUrl,
        telegramUrl,
        facebookUrl,
        canNativeShare,
        handleNativeShare,
        handleCopyLink,
    };
}
