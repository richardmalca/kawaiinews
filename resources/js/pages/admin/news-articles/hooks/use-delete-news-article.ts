import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { destroy } from '@/routes/admin/news-articles';

export function useDeleteNewsArticle() {
    const [processing, setProcessing] = useState(false);

    const deleteArticle = (articleId: number, onSuccess?: () => void) => {
        setProcessing(true);

        const promise = new Promise<void>((resolve, reject) => {
            router.delete(destroy(articleId).url, {
                preserveScroll: true,
                onSuccess: () => {
                    onSuccess?.();
                    resolve();
                },
                onError: () => reject(),
                onFinish: () => setProcessing(false),
            });
        });

        toast.promise(promise, {
            loading: 'Eliminando noticia...',
            success: 'Noticia eliminada',
            error: 'No se pudo eliminar la noticia',
        });
    };

    return { deleteArticle, processing };
}
