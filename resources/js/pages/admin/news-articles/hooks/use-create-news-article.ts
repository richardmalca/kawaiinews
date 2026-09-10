import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { store } from '@/routes/admin/news-articles';

type CreateNewsArticleData = {
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    body: string;
    featured_image: string;
    status: 'draft' | 'published';
    tags: string[];
};

export function useCreateNewsArticle() {
    const [processing, setProcessing] = useState(false);

    const createArticle = (data: CreateNewsArticleData) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.post(store().url, data, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Creando noticia...',
            success: 'Noticia creada correctamente',
            error: 'Revisa los campos e intenta nuevamente',
        });
    };

    return { createArticle, processing };
}
