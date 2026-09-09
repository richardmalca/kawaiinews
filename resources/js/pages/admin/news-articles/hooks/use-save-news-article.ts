import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { update } from '@/routes/admin/news-articles';

type SaveNewsArticleData = {
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    body: string;
    featured_image: string;
    audio_url: string;
    status: 'draft' | 'published';
    tags: string[];
};

export function useSaveNewsArticle() {
    const [processing, setProcessing] = useState(false);

    const saveArticle = (articleId: number, data: SaveNewsArticleData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.put(update(articleId).url, data, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Guardando...',
            success: 'Noticia guardada correctamente',
            error: 'Revisa los campos e intenta nuevamente',
        });
    };

    return { saveArticle, processing };
}
