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

export function estimateReadingTime(content: string | null): number {
    if (!content) return 1;
    const cleanText = content.replace(/<[^>]*>/g, ' ').trim();
    const words = cleanText.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

export function formatArticleAsPlainText(article: {
    title: string;
    excerpt?: string | null;
    body?: string | null;
}): string {
    const title = article.title.trim();
    const excerpt = (article.excerpt ?? '').trim();

    let rawBody = article.body ?? '';
    rawBody = rawBody
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '.\n\n')
        .replace(/<br\s*[/]?>/gi, '\n')
        .replace(/<\/li>/gi, '.\n')
        .replace(/<[^>]+>/g, ' ');

    if (typeof document !== 'undefined') {
        const txt = document.createElement('textarea');
        txt.innerHTML = rawBody;
        rawBody = txt.value;
    }

    const cleanParagraphs = rawBody
        .split(/\n+/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    const sections: string[] = [];

    if (title) {
        const normalizedTitle = /[.!?]$/.test(title) ? title : `${title}.`;
        sections.push(normalizedTitle);
    }

    if (excerpt) {
        const normalizedExcerpt = /[.!?]$/.test(excerpt)
            ? excerpt
            : `${excerpt}.`;
        sections.push(normalizedExcerpt);
    }

    if (cleanParagraphs.length > 0) {
        const bodyWithPauses = cleanParagraphs.map((paragraph) =>
            /[.!?]$/.test(paragraph) ? paragraph : `${paragraph}.`,
        );
        sections.push(bodyWithPauses.join('\n\n'));
    }

    return sections.join('\n\n');
}
