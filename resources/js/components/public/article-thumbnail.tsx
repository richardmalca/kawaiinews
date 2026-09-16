import { Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ArticleThumbnailProps {
    src?: string | null;
    alt?: string;
    aspectRatio?: '16/9' | '16/10' | 'video' | 'square';
    className?: string;
    iconClassName?: string;
    loading?: 'lazy' | 'eager';
    priority?: boolean;
}

export function ArticleThumbnail({
    src,
    alt = '',
    aspectRatio = '16/9',
    className = '',
    iconClassName = 'h-8 w-8 text-neutral-400/80 dark:text-neutral-500/80',
    loading = 'lazy',
}: ArticleThumbnailProps) {
    const [hasError, setHasError] = useState(false);

    const aspectClass =
        aspectRatio === '16/9' || aspectRatio === 'video'
            ? 'aspect-video'
            : aspectRatio === '16/10'
            ? 'aspect-16/10'
            : aspectRatio === 'square'
            ? 'aspect-square'
            : 'aspect-video';

    const showPlaceholder = !src || hasError;

    if (showPlaceholder) {
        return (
            <div
                className={`relative w-full overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 select-none ${aspectClass} ${className}`}
                aria-label={alt || 'Imagen de la noticia'}
            >
                {/* Patrón de fondo sutil neutro */}
                <div className="absolute inset-0 bg-radial from-neutral-200/40 via-transparent to-transparent dark:from-neutral-800/40" />
                <div className="relative flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
                    <ImageIcon className={iconClassName} strokeWidth={1.5} />
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${aspectClass} ${className}`}>
            <img
                src={src}
                alt={alt}
                loading={loading}
                onError={() => setHasError(true)}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
        </div>
    );
}
