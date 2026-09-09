export const PROFILE_LIMITS = {
    avatarMaxBytes: 2 * 1024 * 1024,
    bannerMaxBytes: 4 * 1024 * 1024,
    avatarRecommended: '400 × 400 px',
    bannerRecommended: '1200 × 400 px',
    usernameMinLength: 3,
    usernameMaxLength: 25,
} as const;

export interface AnimeBannerPreset {
    id: string;
    title: string;
    category: string;
    url: string;
    preview: string;
}

export const ANIME_BANNER_PRESETS: AnimeBannerPreset[] = [
    {
        id: 'tokyo-shinjuku-night',
        title: 'Shinjuku Neón',
        category: 'Cyberpunk',
        url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&h=200&q=70',
    },
    {
        id: 'cherry-blossoms-mount-fuji',
        title: 'Sakura & Monte Fuji',
        category: 'Shonen',
        url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&h=200&q=70',
    },
    {
        id: 'akihabara-street-anime',
        title: 'Akihabara Distro',
        category: 'Otaku',
        url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&h=200&q=70',
    },
    {
        id: 'kyoto-torii-gates-mystic',
        title: 'Fushimi Inari Torii',
        category: 'Fantasía',
        url: 'https://images.unsplash.com/photo-1478436127897-769e00d2c715?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1478436127897-769e00d2c715?auto=format&fit=crop&w=600&h=200&q=70',
    },
    {
        id: 'shibuya-crossing-rain',
        title: 'Lluvia en Shibuya',
        category: 'Vida Diaria',
        url: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=600&h=200&q=70',
    },
    {
        id: 'sunset-temple-garden',
        title: 'Crepúsculo Ancestral',
        category: 'Fantasía',
        url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=600&h=200&q=70',
    },
    {
        id: 'osaka-castle-spring',
        title: 'Castillo de Osaka',
        category: 'Shonen',
        url: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=600&h=200&q=70',
    },
    {
        id: 'cyberpunk-city-rain',
        title: 'Metrópolis Neo',
        category: 'Cyberpunk',
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&h=400&q=80',
        preview: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&h=200&q=70',
    },
];

export function validateImageFile(
    file: File,
    type: 'avatar' | 'banner',
): { isValid: boolean; error: string | null } {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedMimeTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Formato no compatible. Por favor sube una imagen JPG, PNG o WebP.',
        };
    }

    const maxBytes =
        type === 'avatar' ? PROFILE_LIMITS.avatarMaxBytes : PROFILE_LIMITS.bannerMaxBytes;
    const maxMb = type === 'avatar' ? 2 : 4;

    if (file.size > maxBytes) {
        return {
            isValid: false,
            error: `El archivo supera el tamaño máximo permitido de ${maxMb} MB.`,
        };
    }

    return { isValid: true, error: null };
}

export function readCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
