export const FALLBACK_IMAGES = {
    hero: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    card: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    thumbnail:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80',
} as const;

export function handleImageFallback(
    e: React.SyntheticEvent<HTMLImageElement>,
    fallbackUrl: string = FALLBACK_IMAGES.thumbnail,
) {
    const target = e.currentTarget;
    if (target.src !== fallbackUrl) {
        target.src = fallbackUrl;
    }
}

export function formatNewsRanking(index: number): string {
    return String(index + 1).padStart(2, '0');
}
