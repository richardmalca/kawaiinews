import { useState } from 'react';

function slugify(value: string): string {
    return value
        .toLowerCase()
        // La "ñ" hay que resolverla ANTES del normalize/strip de abajo:
        // NFD la descompone en "n" + tilde combinante y la tilde se pierde
        // igual que cualquier acento, dejando "años" -> "anos" (otra
        // palabra en español). La reemplazamos por "ni" a mano primero,
        // así "años" queda "anios" — mismo criterio que el backend
        // (NewsArticleService::slugify()).
        .replace(/ñ/g, 'ni')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function useArticleSlug(initialTitle: string, initialSlug: string) {
    const [slug, setSlug] = useState(initialSlug);
    const [slugTouched, setSlugTouched] = useState(false);

    const handleTitleChange = (title: string) => {
        if (!slugTouched) {
            setSlug(slugify(title));
        }
    };

    const handleSlugChange = (value: string) => {
        setSlugTouched(true);
        setSlug(value);
    };

    return { slug, handleTitleChange, handleSlugChange };
}
