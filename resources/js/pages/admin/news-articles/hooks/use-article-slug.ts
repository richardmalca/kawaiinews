import { useState } from 'react';

function slugify(value: string): string {
    return value
        .toLowerCase()
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
